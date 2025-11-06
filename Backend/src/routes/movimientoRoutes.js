const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');

// Obtener todos los movimientos de inventario con filtros
router.get('/', movimientoController.getAll);

// Obtener movimiento por ID
router.get('/:id', movimientoController.getById);

// Crear nuevo movimiento
router.post('/', movimientoController.create);

// Obtener movimientos por producto
router.get('/producto/:id', movimientoController.getByProducto);

// Obtener movimientos por tipo
router.get('/tipo/:tipo', movimientoController.getByTipo);

module.exports = router;