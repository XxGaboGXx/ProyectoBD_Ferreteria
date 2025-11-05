const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Rutas específicas PRIMERO (antes de /:id)
router.get('/bajo-stock', productoController.getLowStock);
router.get('/estadisticas', productoController.getEstadisticas);
router.get('/categoria/:idCategoria', productoController.getByCategoria);

// Rutas generales
router.get('/', productoController.getAll);

// Rutas con :id
router.get('/:id', productoController.getById);
router.get('/:id/movimientos', productoController.getMovimientos);

// CRUD
router.post('/', productoController.create);
router.put('/:id', productoController.update);
router.delete('/:id', productoController.delete);

// Ajustes de inventario
router.post('/:id/ajustar', productoController.adjustStock);

module.exports = router;