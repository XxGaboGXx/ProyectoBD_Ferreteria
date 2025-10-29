const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAll);
router.get('/cedula/:cedula', clienteController.getByCedula);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);
router.get('/:id/historial', clienteController.getHistorialCompras);
router.get('/:id/estadisticas', clienteController.getEstadisticas);

module.exports = router;