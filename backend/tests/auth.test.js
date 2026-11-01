const request = require('supertest');
const { app } = require('../server');
const { User } = require('../models/User');
const prisma = require('../config/database');

// ====================================================
// Testes Unitários — CU01 e CU02 (Auth)
// Executar: npm test
// ====================================================

beforeAll(async () => {
  await prisma.$connect();
  await User.deleteMany({ where: { email: 'teste@travelbuddy.com' } });
});

afterAll(async () => {
  await User.deleteMany({ where: { email: 'teste@travelbuddy.com' } });
  await prisma.$disconnect();
});

// --- CU01 — Cadastrar Usuário ---
describe('CU01 — Cadastrar Usuário (POST /api/auth/register)', () => {
  test('Deve criar conta com dados válidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Teste User',
      email: 'teste@travelbuddy.com',
      password: 'Senha@123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('teste@travelbuddy.com');
  });

  test('FA1 — Deve rejeitar e-mail já cadastrado', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Outro User',
      email: 'teste@travelbuddy.com', // mesmo e-mail
      password: 'Outra@Senha1'
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/e-mail já está em uso/i);
  });

  test('FA3 — Deve rejeitar senha com menos de 8 caracteres', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Senha Fraca',
      email: 'fraca@test.com',
      password: '123'
    });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].msg).toMatch(/mínimo 8 caracteres/i);
  });

  test('FA2 — Deve rejeitar campos obrigatórios em branco', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'semname@test.com',
      password: 'Senha@123'
    });
    expect(res.statusCode).toBe(422);
  });
});

// --- CU02 — Realizar Login ---
describe('CU02 — Realizar Login (POST /api/auth/login)', () => {
  test('Deve autenticar com credenciais válidas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'teste@travelbuddy.com',
      password: 'Senha@123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('FA1 — Deve rejeitar senha incorreta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'teste@travelbuddy.com',
      password: 'SenhaErrada'
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/credenciais inválidas/i);
  });

  test('FA2 — Deve retornar 404 para conta inexistente', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'naoexiste@test.com',
      password: 'Senha@123'
    });
    expect(res.statusCode).toBe(404);
  });
});

// --- CU07 — Favoritos (rota protegida) ---
describe('CU07 — Rota protegida sem token', () => {
  test('Deve retornar 401 sem Bearer Token', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.statusCode).toBe(401);
  });
});
