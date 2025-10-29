const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Rutas de ventas
router.get('/', ventaController.getAll);
router.get('/:id', ventaController.getById);
router.post('/', ventaController.create);
router.put('/:id', ventaController.update);
router.delete('/:id', ventaController.delete);

// Rutas específicas de ventas
router.get('/:id/detalles', ventaController.getDetalles);
router.post('/:id/anular', ventaController.anularVenta);

module.exports = router;