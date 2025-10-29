const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { validateRequired } = require('../middlewares');

// Crear venta
router.post(
    '/',
    validateRequired(['Id_Cliente', 'Id_Colaborador', 'items']),
    ventaController.createVenta
);

// Obtener detalles de venta
router.get('/:id', ventaController.getVentaDetails);

// Cancelar venta
router.post('/:id/cancel', ventaController.cancelVenta);

module.exports = router;