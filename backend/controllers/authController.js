const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// ---- Validações ----
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.') // CU01 FA3
];

const loginValidation = [
  body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória.')
];

// ---- CU01 — Cadastrar Usuário (RF01) ----
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  try {
    const existing = await User.findUnique({ where: { email } });
    if (existing) {
      // CU01 FA1 — e-mail já cadastrado
      return res.status(409).json({ error: 'E-mail já está em uso. Informe outro.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ data: { name, email, password: hashedPassword } });

    // Envia e-mail de boas-vindas (CU01 passo 5)
    await emailService.sendWelcomeEmail(user.email, user.name);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar conta.' });
  }
};

// ---- CU02 — Realizar Login (RF02) ----
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findUnique({ where: { email } });
    if (!user) {
      // CU02 FA2 — conta inexistente
      return res.status(404).json({ error: 'Conta não encontrada. Realize o cadastro.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // CU02 FA1 — credenciais inválidas
      return res.status(401).json({ error: 'Credenciais inválidas. Tente novamente.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};

// ---- Logout (RF02) ----
// JWT é stateless; o logout ocorre no cliente descartando o token.
const logout = (req, res) => {
  return res.json({ message: 'Logout realizado. Descarte o token no cliente.' });
};

// ---- Recuperação de senha (CU02 FA3) ----
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(422).json({ error: 'E-mail obrigatório.' });

  try {
    const user = await User.findUnique({ where: { email } });
    // Resposta genérica por segurança (não revela se e-mail existe)
    if (user) {
      const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    }
    return res.json({ message: 'Se o e-mail existir, enviaremos as instruções de recuperação.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
};

module.exports = { register, login, logout, forgotPassword, registerValidation, loginValidation };
