const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// Middleware de autenticação (verifica JWT)
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findUnique({ where: { id: Number(decoded.id) } });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Middleware para verificar se é premium
const requirePremium = (req, res, next) => {
  if (req.user.plan !== 'premium') {
    return res.status(403).json({ error: 'Funcionalidade exclusiva do plano Premium.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requirePremium };
