const { spawnSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
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
  process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`;
}

const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
});

if (result.error) throw result.error;
process.exitCode = result.status === null ? 1 : result.status;
