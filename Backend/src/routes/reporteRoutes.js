const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// Reportes principales
router.get('/ventas', reporteController.reporteVentas);
router.get('/inventario', reporteController.reporteInventario);
router.get('/clientes', reporteController.reporteClientes);
router.get('/productos-mas-vendidos', reporteController.reporteProductosMasVendidos);
router.get('/compras', reporteController.reporteCompras);
router.get('/alquileres', reporteController.reporteAlquileres);

module.exports = router;