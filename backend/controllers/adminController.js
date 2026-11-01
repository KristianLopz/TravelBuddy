const { Destination } = require('../models/Destination');
const { body, validationResult } = require('express-validator');

const destinationValidation = [
  body('name').trim().notEmpty().withMessage('Nome do destino é obrigatório.'),
  body('country').trim().notEmpty().withMessage('País é obrigatório.'),
  body('estimated_cost').isFloat({ gt: 0 }).withMessage('Custo estimado deve ser positivo.')
];

// ---- CU09 — Cadastrar Destino (RF08) ----
const createDestination = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const destination = await Destination.create({ data: req.body });
    return res.status(201).json({ message: 'Destino cadastrado com sucesso!', destination });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar destino.' });
  }
};

// Atualizar destino
const updateDestination = async (req, res) => {
  const { id } = req.params;
  try {
    const destination = await Destination.findUnique({ where: { id: Number(id) } });
    if (!destination) return res.status(404).json({ error: 'Destino não encontrado.' });

    const updatedDestination = await Destination.update({
      where: { id: destination.id },
      data: req.body
    });
    return res.json({ message: 'Destino atualizado com sucesso!', destination: updatedDestination });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar destino.' });
  }
};

// Listar todos os destinos (admin vê inativos também)
const listAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.findMany({ orderBy: { name: 'asc' } });
    return res.json({ total: destinations.length, destinations });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar destinos.' });
  }
};

// Ativar/desativar destino
const toggleDestination = async (req, res) => {
  const { id } = req.params;
  try {
    const destination = await Destination.findUnique({ where: { id: Number(id) } });
    if (!destination) return res.status(404).json({ error: 'Destino não encontrado.' });

    const updatedDestination = await Destination.update({
      where: { id: destination.id },
      data: { active: !destination.active }
    });
    return res.json({
      message: `Destino ${updatedDestination.active ? 'ativado' : 'desativado'} com sucesso.`,
      destination: updatedDestination
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar status do destino.' });
  }
};

module.exports = { createDestination, updateDestination, listAllDestinations, toggleDestination, destinationValidation };
