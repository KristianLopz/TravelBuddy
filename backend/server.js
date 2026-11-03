const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const prisma = require('./config/database');
const { User } = require('./models/User');
const bcrypt = require('bcryptjs');
const { ensureSeedDestinations } = require('./services/seedDestinations');

const authRoutes = require('./routes/auth');
const destinationsRoutes = require('./routes/destinations');
const itineraryRoutes = require('./routes/itinerary');
const favoritesRoutes = require('./routes/favorites');
const subscriptionRoutes = require('./routes/subscription');
const adminRoutes = require('./routes/admin');

const app = express();

// Middlewares globais
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || (isProduction ? 100 : 5000)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
});

if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  app.use('/api/', limiter);
}

app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'TravelBuddy API' }));

// Handler de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});


async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@travelbuddy.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Configure ADMIN_PASSWORD no arquivo .env antes de iniciar o backend.');
  }

  const admin = await User.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    await User.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'admin',
        plan: 'premium'
      }
    });
    console.log(`Admin criado: ${adminEmail}`);
    return;
  }

  const passwordOk = await bcrypt.compare(adminPassword, admin.password);

  if (!passwordOk || admin.role !== 'admin') {
    const data = { role: 'admin' };
    if (!passwordOk) data.password = await bcrypt.hash(adminPassword, 12);
    if (!admin.plan) data.plan = 'premium';
    await User.update({
      where: { id: admin.id },
      data
    });
    console.log(`Admin atualizado: ${adminEmail}`);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    await ensureSeedDestinations();
    await ensureAdminUser();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`TravelBuddy API rodando na porta ${PORT}`));
  } catch (error) {
    console.error('Erro ao iniciar o backend. Verifique a conexão PostgreSQL e aplique o schema com "npm run db:push".');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
