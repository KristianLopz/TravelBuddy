const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const requiredVariables = ['DB_NAME', 'DB_USER'];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Variáveis de banco ausentes: ${missingVariables.join(', ')}`);
  }

  const user = encodeURIComponent(process.env.DB_USER);
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const database = encodeURIComponent(process.env.DB_NAME);

  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

module.exports = prisma;
