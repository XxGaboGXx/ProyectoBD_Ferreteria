const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');

// Rutas específicas (ANTES de /:id)
router.get('/activos', alquilerController.getActivos);
router.get('/vencidos', alquilerController.getVencidos);
router.get('/estadisticas', alquilerController.getEstadisticas);
router.get('/cliente/:clienteId/historial', alquilerController.getHistorialCliente);

// Lista general
router.get('/', alquilerController.getAll);

// Ruta genérica con :id
router.get('/:id', alquilerController.getById);

// CRUD y acciones
router.post('/', alquilerController.create);
router.post('/:id/finalizar', alquilerController.finalizar);
router.post('/:id/extender', alquilerController.extender);
router.post('/:id/cancelar', alquilerController.cancelar);

module.exports = router;