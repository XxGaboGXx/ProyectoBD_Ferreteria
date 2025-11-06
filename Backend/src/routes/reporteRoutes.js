const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { validarFechas } = require('../middlewares/validator');

/**
 * @route   GET /api/reportes/ventas
 * @desc    Reporte de ventas por período
 */
router.get('/ventas', reporteController.getReporteVentas);

/**
 * @route   GET /api/reportes/compras
 * @desc    Reporte de compras por período
 */
router.get('/compras', reporteController.getReporteCompras);

/**
 * @route   GET /api/reportes/alquileres
 * @desc    Reporte de alquileres por período
 */
router.get('/alquileres', reporteController.getReporteAlquileres);

/**
 * @route   GET /api/reportes/inventario
 * @desc    Reporte de inventario actual
 */
router.get('/inventario', reporteController.getReporteInventario);

/**
 * @route   GET /api/reportes/clientes
 * @desc    Reporte de clientes
 */
router.get('/clientes', reporteController.getReporteClientes);

/**
 * @route   GET /api/reportes/productos-mas-vendidos
 * @desc    Top productos más vendidos
 * ✅ CORREGIDO: Ahora usa SP_ObtenerTopProductos
 */
router.get('/productos-mas-vendidos', reporteController.getProductosMasVendidos);

/**
 * @route   GET /api/reportes/top-productos
 * @desc    Top 10 productos más vendidos
 * ✅ NUEVO ENDPOINT
 */
router.get('/top-productos', reporteController.getTopProductos);

/**
 * @route   GET /api/reportes/top-clientes
 * @desc    Top 10 clientes
 * ✅ NUEVO ENDPOINT
 */
router.get('/top-clientes', reporteController.getTopClientes);

/**
 * @route   GET /api/reportes/bajo-stock
 * @desc    Productos con stock bajo
 */
router.get('/bajo-stock', reporteController.getProductosBajoStock);

/**
 * @route   GET /api/reportes/ventas-por-periodo
 * @desc    Ventas agrupadas por período
 */
router.get('/ventas-por-periodo', reporteController.getVentasPorPeriodo);

module.exports = router;