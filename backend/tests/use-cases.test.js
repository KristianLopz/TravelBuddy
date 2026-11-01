const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('../server');
const prisma = require('../config/database');

const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const userEmail = `use-cases-${uniqueId}@travelbuddy.test`;
const adminEmail = `use-cases-admin-${uniqueId}@travelbuddy.test`;
const destinationName = `Destino de teste ${uniqueId}`;

let user;
let admin;
let destination;
let adminDestinationId;
let userToken;
let adminToken;

beforeAll(async () => {
  await prisma.$connect();

  const password = await bcrypt.hash('Teste@12345', 12);
  user = await prisma.user.create({
    data: {
      name: 'Usuário de teste',
      email: userEmail,
      password
    }
  });
  admin = await prisma.user.create({
    data: {
      name: 'Admin de teste',
      email: adminEmail,
      password,
      role: 'admin',
      plan: 'premium'
    }
  });
  destination = await prisma.destination.create({
    data: {
      name: destinationName,
      country: 'Brasil',
      estimated_cost: 1200,
      tourist_spots: ['Praça central', 'Museu local'],
      active: true
    }
  });

  userToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  adminToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  if (user && destination) {
    await prisma.itinerary.deleteMany({
      where: { user_id: user.id, destination_id: destination.id }
    });
    await prisma.favorite.deleteMany({
      where: { user_id: user.id, destination_id: destination.id }
    });
  }
  if (destination) {
    await prisma.destination.delete({ where: { id: destination.id } });
  }
  if (adminDestinationId) {
    await prisma.destination.deleteMany({ where: { id: adminDestinationId } });
  }
  if (user) await prisma.user.delete({ where: { id: user.id } });
  if (admin) await prisma.user.delete({ where: { id: admin.id } });
  await prisma.$disconnect();
});

describe('Casos de uso do TravelBuddy', () => {
  test('CU03 — salva o orçamento do usuário', async () => {
    const response = await request(app)
      .post('/api/destinations/budget')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ budget: 2400, duration_days: 4, num_people: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.budget).toBe(2400);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(Number(updatedUser.last_budget)).toBe(2400);
  });

  test('CU04 — sugere destinos dentro do orçamento por pessoa', async () => {
    const response = await request(app)
      .get('/api/destinations/suggestions')
      .query({ budget: 2200, num_people: 2 })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.max_cost_per_person).toBe(1100);
    expect(response.body.destinations).not.toContainEqual(
      expect.objectContaining({ name: destinationName })
    );

    const affordableResponse = await request(app)
      .get('/api/destinations/suggestions')
      .query({ budget: 2400, num_people: 2 })
      .set('Authorization', `Bearer ${userToken}`);

    expect(affordableResponse.statusCode).toBe(200);
    expect(affordableResponse.body.destinations).toContainEqual(
      expect.objectContaining({ name: destinationName })
    );
  });

  test('CU05 — mostra os detalhes de um destino ativo', async () => {
    const response = await request(app)
      .get(`/api/destinations/${destination.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.destination.name).toBe(destinationName);
    expect(response.body.destination.tourist_spots).toEqual(['Praça central', 'Museu local']);
    expect(response.body.incomplete).toBe(false);
  });

  test('CU06 — gera e lista um roteiro para o usuário autenticado', async () => {
    const response = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination_id: destination.id,
        duration_days: 2,
        budget: 2400,
        num_people: 2
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.itinerary.destination).toBe(destinationName);
    expect(response.body.itinerary.activities).toHaveLength(2);

    const listResponse = await request(app)
      .get('/api/itinerary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.itineraries).toContainEqual(
      expect.objectContaining({ destination_id: destination.id })
    );

    const latestResponse = await request(app)
      .get(`/api/itinerary/destination/${destination.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(latestResponse.statusCode).toBe(200);
    expect(latestResponse.body.itinerary.destination).toBe(destinationName);
  });

  test('CU07 — salva, consulta e remove um destino favorito', async () => {
    const addResponse = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ destination_id: destination.id, notes: 'Teste de favorito' });

    expect(addResponse.statusCode).toBe(201);
    expect(addResponse.body.favorite.Destination.name).toBe(destinationName);

    const checkResponse = await request(app)
      .get(`/api/favorites/check/${destination.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(checkResponse.statusCode).toBe(200);
    expect(checkResponse.body.favorited).toBe(true);

    const listResponse = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.favorites).toContainEqual(
      expect.objectContaining({ Destination: expect.objectContaining({ name: destinationName }) })
    );

    const removeResponse = await request(app)
      .delete(`/api/favorites/destination/${destination.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(removeResponse.statusCode).toBe(200);
  });

  test('CU08 — assina, consulta e cancela o plano Premium', async () => {
    const subscribeResponse = await request(app)
      .post('/api/subscription/subscribe')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ payment_method: 'pix', billing_cycle: 'mensal' });

    expect(subscribeResponse.statusCode).toBe(200);
    expect(subscribeResponse.body.plan).toBe('premium');

    const statusResponse = await request(app)
      .get('/api/subscription/status')
      .set('Authorization', `Bearer ${userToken}`);

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.body.plan).toBe('premium');

    const cancelResponse = await request(app)
      .post('/api/subscription/cancel')
      .set('Authorization', `Bearer ${userToken}`);

    expect(cancelResponse.statusCode).toBe(200);

    const finalStatus = await prisma.user.findUnique({ where: { id: user.id } });
    expect(finalStatus.plan).toBe('free');
  });

  test('CU09 — restringe a criação de destinos a administradores', async () => {
    const forbiddenResponse = await request(app)
      .post('/api/admin/destinations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Não autorizado ${uniqueId}`,
        country: 'Brasil',
        estimated_cost: 100
      });

    expect(forbiddenResponse.statusCode).toBe(403);

    const createResponse = await request(app)
      .post('/api/admin/destinations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Destino admin ${uniqueId}`,
        country: 'Brasil',
        estimated_cost: 100
      });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.destination.name).toBe(`Destino admin ${uniqueId}`);
    adminDestinationId = createResponse.body.destination.id;

    const listResponse = await request(app)
      .get('/api/admin/destinations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.destinations).toContainEqual(
      expect.objectContaining({ id: adminDestinationId })
    );

    const updateResponse = await request(app)
      .put(`/api/admin/destinations/${adminDestinationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Destino admin editado ${uniqueId}` });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.destination.name).toBe(`Destino admin editado ${uniqueId}`);

    const toggleResponse = await request(app)
      .patch(`/api/admin/destinations/${adminDestinationId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(toggleResponse.statusCode).toBe(200);
    expect(toggleResponse.body.destination.active).toBe(false);
  });
});
