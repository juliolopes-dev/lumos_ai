const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');

router.get('/resumo', usageController.resumo);

module.exports = router;
