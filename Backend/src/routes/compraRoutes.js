const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

// Rutas específicas PRIMERO
router.get('/estadisticas', compraController.getEstadisticas);
router.get('/productos-mas-comprados', compraController.getProductosMasComprados);

// Lista general
router.get('/', compraController.getAll);

// Ruta genérica con :id
router.get('/:id', compraController.getById);

// CRUD
router.post('/', compraController.create);

module.exports = router;