const { Favorite } = require('../models/Relations');
const { Destination } = require('../models/Destination');

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toPositiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const destinationInclude = {
  destination: {
    select: {
      id: true,
      name: true,
      country: true,
      state: true,
      estimated_cost: true,
      image_url: true,
      climate: true,
      best_season: true
    }
  }
};

function formatFavorite(favorite) {
  if (!favorite) return favorite;
  const { destination, ...data } = favorite;
  return { ...data, Destination: destination };
}

// ---- CU07 — Salvar Viagem Favorita (RF07) ----
const addFavorite = async (req, res) => {
  const { destination_id, notes, budget_value, budget_days, budget_people } = req.body;
  const userId = req.user.id;

  if (!destination_id) {
    return res.status(422).json({ error: 'Destino obrigatório para favoritar.' });
  }

  try {
    const destinationId = Number(destination_id);
    const destination = await Destination.findUnique({ where: { id: destinationId } });
    if (!destination) {
      return res.status(404).json({ error: 'Destino não encontrado.' });
    }

    const favoritePayload = {
      user_id: userId,
      destination_id: destinationId,
      notes: notes || '',
      budget_value: toPositiveNumber(budget_value),
      budget_days: toPositiveInt(budget_days),
      budget_people: toPositiveInt(budget_people)
    };

    // CU07 FA1 — item já favoritado: atualiza os dados de orçamento para manter sincronizado.
    const existing = await Favorite.findFirst({
      where: { user_id: userId, destination_id: destinationId }
    });
    if (existing) {
      await Favorite.update({ where: { id: existing.id }, data: favoritePayload });
      const favorite = await Favorite.findUnique({
        where: { id: existing.id },
        include: destinationInclude
      });
      return res.json({
        message: 'Favorito atualizado com os dados do orçamento atual.',
        favorite: formatFavorite(favorite),
        already_favorite: true
      });
    }

    const created = await Favorite.create({ data: favoritePayload });
    const favorite = await Favorite.findUnique({
      where: { id: created.id },
      include: destinationInclude
    });

    return res.status(201).json({
      message: 'Viagem adicionada aos favoritos!',
      favorite: formatFavorite(favorite),
      already_favorite: false
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar favorito.' });
  }
};

// Lista favoritos do usuário
const listFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.findMany({
      where: { user_id: req.user.id },
      include: destinationInclude,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ total: favorites.length, favorites: favorites.map(formatFavorite) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar favoritos.' });
  }
};

const checkFavorite = async (req, res) => {
  const { destination_id } = req.params;

  try {
    const favorite = await Favorite.findFirst({
      where: { user_id: req.user.id, destination_id: Number(destination_id) },
      include: destinationInclude
    });

    return res.json({ favorited: !!favorite, favorite: formatFavorite(favorite) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao verificar favorito.' });
  }
};

// Remove favorito pelo ID do favorito
const removeFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const favorite = await Favorite.findFirst({
      where: { id: Number(id), user_id: req.user.id }
    });
    if (!favorite) return res.status(404).json({ error: 'Favorito não encontrado.' });

    await Favorite.delete({ where: { id: favorite.id } });
    return res.json({ message: 'Favorito removido com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
};

// Remove favorito pelo destino, útil para manter a tela de detalhes sincronizada.
const removeFavoriteByDestination = async (req, res) => {
  const { destination_id } = req.params;

  try {
    const favorite = await Favorite.findFirst({
      where: { destination_id: Number(destination_id), user_id: req.user.id }
    });
    if (!favorite) return res.status(404).json({ error: 'Favorito não encontrado.' });

    await Favorite.delete({ where: { id: favorite.id } });
    return res.json({ message: 'Favorito removido com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
};

module.exports = {
  addFavorite,
  listFavorites,
  checkFavorite,
  removeFavorite,
  removeFavoriteByDestination
};
