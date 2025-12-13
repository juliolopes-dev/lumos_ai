const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

// POST /api/assistentes - Criar assistente
router.post('/', assistantController.criar);

// GET /api/assistentes - Listar todos
router.get('/', assistantController.listarTodos);

// GET /api/assistentes/:id - Buscar por ID
router.get('/:id', assistantController.buscarPorId);

// PUT /api/assistentes/:id - Atualizar
router.put('/:id', assistantController.atualizar);

// DELETE /api/assistentes/:id - Excluir
router.delete('/:id', assistantController.excluir);

module.exports = router;
