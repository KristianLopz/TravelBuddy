const prisma = require('../config/database');

module.exports = {
  Favorite: prisma.favorite,
  Itinerary: prisma.itinerary
};
