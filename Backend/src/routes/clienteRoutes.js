const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rutas específicas primero (antes de /:id)
router.get('/activos', clienteController.getActivos);
router.get('/inactivos', clienteController.getInactivos);

// Rutas CRUD básicas
router.get('/', clienteController.getAll);
router.post('/', clienteController.create);

// Rutas específicas con parámetros (ANTES de /:id genérico)
router.get('/cedula/:cedula', clienteController.getByCedula);

// Rutas de recursos relacionados (ANTES de /:id)
router.get('/:id/historial', clienteController.getHistorialCompras);
router.get('/:id/ventas', clienteController.getHistorialCompras); // Alias
router.get('/:id/estadisticas', clienteController.getEstadisticas);

// Rutas de acciones
router.patch('/:id/desactivar', clienteController.desactivar);
router.patch('/:id/reactivar', clienteController.reactivar);

// Rutas genéricas al final
router.get('/:id', clienteController.getById);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);

module.exports = router;