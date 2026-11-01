const { Destination } = require('../models/Destination');
const { User } = require('../models/User');

function parsePositiveNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Lista geral de destinos ativos: usada para a tela mostrar TODOS os destinos.
const getAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.findMany({
      where: { active: true },
      orderBy: [{ estimated_cost: 'asc' }, { name: 'asc' }],
    });

    return res.json({ total: destinations.length, destinations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar destinos.' });
  }
};

// ---- CU04 — Receber Sugestões de Destinos (RF03, RF04) ----
const getSuggestions = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findUnique({ where: { id: userId } });
    const budget = parsePositiveNumber(req.query.budget, parsePositiveNumber(user?.last_budget));
    const numPeople = parsePositiveNumber(req.query.num_people, 1);

    if (!budget || budget <= 0) {
      // CU04 FA2 — orçamento não definido.
      // Retornamos 200 com lista vazia para a tela continuar exibindo todos os destinos.
      return res.json({
        budget: 0,
        num_people: numPeople,
        total: 0,
        destinations: [],
        message: 'Defina seu orçamento para ver destinos compatíveis.',
        redirect: '/orcamento',
      });
    }

    const maxCostPerPerson = budget / numPeople;

    const destinations = await Destination.findMany({
      where: {
        estimated_cost: { lte: maxCostPerPerson },
        active: true,
      },
      orderBy: [{ estimated_cost: 'asc' }, { name: 'asc' }],
    });

    return res.json({
      budget,
      num_people: numPeople,
      max_cost_per_person: maxCostPerPerson,
      total: destinations.length,
      destinations,
      message: destinations.length
        ? 'Destinos compatíveis encontrados.'
        : 'Nenhum destino encontrado para este orçamento. Tente aumentar o orçamento ou reduzir a quantidade de pessoas.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar sugestões.' });
  }
};

// ---- CU05 — Visualizar Detalhes do Destino (RF05) ----
const getDestinationById = async (req, res) => {
  const { id } = req.params;

  try {
    const destination = await Destination.findFirst({ where: { id: Number(id), active: true } });
    if (!destination) {
      return res.status(404).json({ error: 'Destino não encontrado.' });
    }

    const touristSpots = destination.tourist_spots || [];
    const incomplete = !Array.isArray(touristSpots) || touristSpots.length === 0;
    return res.json({ destination, incomplete });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar destino.' });
  }
};

// ---- CU03 — Salvar Orçamento (RF03) ----
const saveBudget = async (req, res) => {
  const { budget, duration_days, num_people } = req.body;
  const parsedBudget = parsePositiveNumber(budget);

  if (!parsedBudget) {
    // CU03 FA1 — valor inválido
    return res.status(422).json({ error: 'Valor do orçamento deve ser positivo.' });
  }

  try {
    await User.update({
      where: { id: req.user.id },
      data: { last_budget: parsedBudget }
    });

    return res.json({
      message: 'Orçamento salvo com sucesso!',
      budget: parsedBudget,
      duration_days: parsePositiveNumber(duration_days, null),
      num_people: parsePositiveNumber(num_people, 1),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar orçamento.' });
  }
};

module.exports = { getAllDestinations, getSuggestions, getDestinationById, saveBudget };
