const { Itinerary } = require('../models/Relations');
const { Destination } = require('../models/Destination');

const destinationInclude = {
  destination: {
    select: { id: true, name: true, country: true, image_url: true }
  }
};

function parseJsonMaybe(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_err) {
      return fallback;
    }
  }
  return fallback;
}

function montarRespostaRoteiro(itinerary, destination, activities) {
  return {
    id: itinerary.id,
    destination_id: itinerary.destination_id,
    destination: destination.name,
    duration_days: Number(itinerary.duration_days),
    num_people: Number(itinerary.num_people || 1),
    budget: Number(itinerary.budget || 0),
    total_estimated_cost: Number(itinerary.total_estimated_cost || 0),
    activities: parseJsonMaybe(activities || itinerary.activities, [])
  };
}

// ---- CU06 — Gerar Roteiro de Viagem (RF03, RF05, RF06) ----
const generateItinerary = async (req, res) => {
  const { destination_id, duration_days, budget, num_people } = req.body;
  const userId = req.user.id;

  const destinationId = Number(destination_id);
  const days = Number.parseInt(duration_days, 10);
  const people = Math.max(1, Number.parseInt(num_people || 1, 10) || 1);

  if (!destinationId) {
    return res.status(422).json({ error: 'Informe o destino para gerar o roteiro.' });
  }

  if (!days || days <= 0) {
    // CU06 FA1 — duração não informada
    return res.status(422).json({ error: 'Informe a duração da viagem em dias.' });
  }

  try {
    const destination = await Destination.findUnique({ where: { id: destinationId } });
    if (!destination) return res.status(404).json({ error: 'Destino não encontrado.' });

    const spots = parseJsonMaybe(destination.tourist_spots, []);

    if (spots.length === 0) {
      // CU06 FA2 — destino sem atividades suficientes
      return res.status(200).json({
        warning: 'Este destino possui informações limitadas. Exibindo o que está disponível.',
        destination: destination.name,
        itinerary: null
      });
    }

    // Distribui atividades por dia sem quebrar a tela quando houver poucos pontos turísticos.
    const activities = [];
    const costPerDay = Number(destination.estimated_cost || 0) / days;

    for (let day = 1; day <= days; day++) {
      const daySpots = spots.filter((_, index) => index % days === day - 1);
      activities.push({
        day,
        title: `Dia ${day} em ${destination.name}`,
        activities: daySpots.length > 0 ? daySpots : ['Dia livre para explorar a cidade com calma'],
        estimated_cost_day: Number(costPerDay.toFixed(2))
      });
    }

    const totalCost = Number(destination.estimated_cost || 0) * people;
    const finalBudget = Number(budget || totalCost || 0);

    // Evita criar o mesmo roteiro várias vezes quando o React roda duas vezes no modo de desenvolvimento
    // ou quando o usuário clica mais de uma vez no botão de gerar roteiro.
    let itinerary = await Itinerary.findFirst({
      where: {
        user_id: userId,
        destination_id: destinationId,
        duration_days: days,
        num_people: people
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (itinerary) {
      itinerary = await Itinerary.update({
        where: { id: itinerary.id },
        data: {
          budget: finalBudget,
          activities,
          total_estimated_cost: totalCost
        }
      });

      // Remove duplicatas antigas com os mesmos dados, caso já tenham sido criadas antes da correção.
      await Itinerary.deleteMany({
        where: {
          user_id: userId,
          destination_id: destinationId,
          duration_days: days,
          num_people: people,
          id: { not: itinerary.id }
        }
      });
    } else {
      itinerary = await Itinerary.create({
        data: {
          user_id: userId,
          destination_id: destinationId,
          duration_days: days,
          num_people: people,
          budget: finalBudget,
          activities,
          total_estimated_cost: totalCost
        }
      });
    }

    return res.status(201).json({
      message: itinerary ? 'Roteiro gerado com sucesso!' : 'Roteiro salvo com sucesso!',
      itinerary: montarRespostaRoteiro(itinerary, destination, activities)
    });
  } catch (err) {
    console.error('Erro ao gerar roteiro:', err);
    return res.status(500).json({ error: 'Erro ao gerar roteiro.' });
  }
};

// Lista roteiros do usuário autenticado
const listItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.findMany({
      where: { user_id: req.user.id },
      include: destinationInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    // Não deixa aparecer o mesmo roteiro repetido na tela de Favoritos.
    const seen = new Set();
    const duplicatesToRemove = [];
    const uniqueItineraries = [];

    for (const itinerary of itineraries) {
      const key = [
        itinerary.user_id,
        itinerary.destination_id,
        itinerary.duration_days,
        itinerary.num_people || 1
      ].join('-');

      if (seen.has(key)) {
        duplicatesToRemove.push(itinerary.id);
      } else {
        seen.add(key);
        uniqueItineraries.push(itinerary);
      }
    }

    if (duplicatesToRemove.length > 0) {
      await Itinerary.deleteMany({
        where: { id: { in: duplicatesToRemove }, user_id: req.user.id }
      });
    }

    return res.json({
      itineraries: uniqueItineraries.map((itinerary) => {
        const { destination, ...data } = itinerary;
        return { ...data, Destination: destination };
      })
    });
  } catch (err) {
    console.error('Erro ao listar roteiros:', err);
    return res.status(500).json({ error: 'Erro ao listar roteiros.' });
  }
};


// Busca o roteiro mais recente do usuário para um destino, sem criar novo registro.
const getLatestItineraryByDestination = async (req, res) => {
  const destinationId = Number(req.params.destinationId);

  if (!destinationId) {
    return res.status(422).json({ error: 'Destino inválido.' });
  }

  try {
    const itinerary = await Itinerary.findFirst({
      where: { user_id: req.user.id, destination_id: destinationId },
      include: destinationInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Nenhum roteiro salvo para este destino.' });
    }

    return res.json({
      itinerary: {
        id: itinerary.id,
        destination_id: itinerary.destination_id,
        destination: itinerary.destination?.name || 'Destino',
        duration_days: Number(itinerary.duration_days || 1),
        num_people: Number(itinerary.num_people || 1),
        budget: Number(itinerary.budget || 0),
        total_estimated_cost: Number(itinerary.total_estimated_cost || 0),
        activities: parseJsonMaybe(itinerary.activities, [])
      }
    });
  } catch (err) {
    console.error('Erro ao buscar roteiro:', err);
    return res.status(500).json({ error: 'Erro ao buscar roteiro salvo.' });
  }
};

module.exports = { generateItinerary, listItineraries, getLatestItineraryByDestination };
