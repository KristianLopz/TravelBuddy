const { User } = require('../models/User');
const emailService = require('../services/emailService');

// ---- CU08 — Gerenciar Assinatura Premium (RF09, RF10) ----

const allowedPaymentMethods = ['cartao', 'cartao_credito', 'pix', 'boleto'];

function normalizePaymentMethod(method) {
  if (method === 'cartao_credito') return 'cartao';
  return method;
}

// Assinar plano Premium
const subscribe = async (req, res) => {
  const {
    payment_method = 'cartao',
    billing_cycle = 'mensal',
    card_token,
  } = req.body;
  const user = req.user;

  const normalizedPayment = normalizePaymentMethod(payment_method);

  if (!allowedPaymentMethods.includes(payment_method)) {
    return res.status(422).json({ error: 'Forma de pagamento inválida.' });
  }

  if (!['mensal', 'anual'].includes(billing_cycle)) {
    return res.status(422).json({ error: 'Ciclo de cobrança inválido.' });
  }

  if (user.plan === 'premium') {
    return res.status(409).json({ error: 'Você já possui o plano Premium ativo.' });
  }

  try {
    // Pagamento simulado e aprovado.
    // Em produção, card_token/payment_method seriam enviados para um gateway de pagamento.
    const expiresAt = new Date();
    if (billing_cycle === 'anual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    await User.update({
      where: { id: user.id },
      data: { plan: 'premium', subscription_expires_at: expiresAt }
    });
    await emailService.sendSubscriptionConfirmation(user.email, user.name, expiresAt);

    return res.json({
      message: `Assinatura Premium ativada com sucesso via ${normalizedPayment.toUpperCase()}!`,
      plan: 'premium',
      billing_cycle,
      payment_method: normalizedPayment,
      expires_at: expiresAt,
      simulated_payment: !card_token || card_token === 'pagamento_simulado_local'
    });
  } catch (err) {
    console.error(err);
    // CU08 FA1 — pagamento recusado
    return res.status(402).json({ error: 'Pagamento recusado. Tente outro método de pagamento.' });
  }
};

// Cancelar assinatura Premium (CU08 FA2)
const cancel = async (req, res) => {
  const user = req.user;

  if (user.plan !== 'premium') {
    return res.status(400).json({ error: 'Nenhuma assinatura ativa para cancelar.' });
  }

  try {
    // Mantém a data de expiração como referência do período já pago.
    await User.update({
      where: { id: user.id },
      data: { plan: 'free' }
    });
    await emailService.sendCancellationEmail(user.email, user.name, user.subscription_expires_at || new Date());

    return res.json({
      message: 'Assinatura cancelada. O registro do período pago foi mantido para consulta.',
      access_until: user.subscription_expires_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao cancelar assinatura.' });
  }
};

// Consultar status da assinatura
const status = async (req, res) => {
  const user = await User.findUnique({ where: { id: req.user.id } });

  return res.json({
    plan: user.plan,
    subscription_expires_at: user.subscription_expires_at
  });
};

module.exports = { subscribe, cancel, status };
