const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// ============================================
// 📊 RUTAS JSON (Ya existentes)
// ============================================
router.get('/ventas', reporteController.getReporteVentas);
router.get('/compras', reporteController.getReporteCompras);
router.get('/alquileres', reporteController.getReporteAlquileres);
router.get('/inventario', reporteController.getReporteInventario);
router.get('/clientes', reporteController.getReporteClientes);
router.get('/productos-mas-vendidos', reporteController.getProductosMasVendidos);
router.get('/top-productos', reporteController.getTopProductos);
router.get('/top-clientes', reporteController.getTopClientes);
router.get('/bajo-stock', reporteController.getProductosBajoStock);
router.get('/ventas-por-periodo', reporteController.getVentasPorPeriodo);

// ============================================
// 📄 RUTAS PDF (IMPORTANTE: DEBEN IR DESPUÉS DE LAS JSON)
// ============================================
router.get('/ventas/pdf', reporteController.descargarPDFVentas);
router.get('/compras/pdf', reporteController.descargarPDFCompras);
router.get('/alquileres/pdf', reporteController.descargarPDFAlquileres);
router.get('/inventario/pdf', reporteController.descargarPDFInventario);
router.get('/productos-mas-vendidos/pdf', reporteController.descargarPDFTopProductos);
router.get('/top-clientes/pdf', reporteController.descargarPDFTopClientes);

module.exports = router;