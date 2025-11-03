const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rutas específicas primero
router.get('/activos', clienteController.getActivos);
router.get('/inactivos', clienteController.getInactivos);
router.get('/', clienteController.getAll);
router.get('/cedula/:cedula', clienteController.getByCedula);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);

router.get('/:id/historial', clienteController.getHistorialCompras);
router.get('/:id/estadisticas', clienteController.getEstadisticas);

router.patch('/:id/desactivar', clienteController.desactivar);
router.patch('/:id/reactivar', clienteController.reactivar);



module.exports = router;