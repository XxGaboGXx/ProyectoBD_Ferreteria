const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @route   GET /api/dashboard/summary
 * @desc    Obtener resumen general del dashboard
 * @access  Private
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @route   GET /api/dashboard/ventas-por-dia
 * @desc    Obtener ventas agrupadas por día
 * @access  Private
 */
router.get('/ventas-por-dia', dashboardController.getVentasPorDia);

/**
 * @route   GET /api/dashboard/ventas-por-categoria
 * @desc    Obtener ventas agrupadas por categoría
 * @access  Private
 */
router.get('/ventas-por-categoria', dashboardController.getVentasPorCategoria);

/**
 * @route   GET /api/dashboard/ventas-por-metodo-pago
 * @desc    Obtener ventas agrupadas por método de pago
 * @access  Private
 */
router.get('/ventas-por-metodo-pago', dashboardController.getVentasPorMetodoPago);

/**
 * @route   GET /api/dashboard/top-clientes
 * @desc    Obtener top clientes por compras
 * @access  Private
 */
router.get('/top-clientes', dashboardController.getTopClientes);

/**
 * @route   GET /api/dashboard/rendimiento-colaboradores
 * @desc    Obtener rendimiento de colaboradores
 * @access  Private
 */

router.get('/top-productos', dashboardController.getTopProductos);

/**
 * @route   GET /api/dashboard/rendimiento-colaboradores
 * @desc    Obtener rendimiento de colaboradores
 * @access  Private
 */

router.get('/rendimiento-colaboradores', dashboardController.getRendimientoColaboradores);

/**
 * @route   GET /api/dashboard/analisis-inventario
 * @desc    Obtener análisis completo del inventario
 * @access  Private
 */
router.get('/analisis-inventario', dashboardController.getAnalisisInventario);

/**
 * @route   GET /api/dashboard/movimientos-recientes
 * @desc    Obtener movimientos recientes de inventario
 * @access  Private
 */
router.get('/movimientos-recientes', dashboardController.getMovimientosRecientes);

/**
 * @route   GET /api/dashboard/resumen-financiero
 * @desc    Obtener resumen financiero (ventas, compras, utilidad)
 * @access  Private
 */
router.get('/resumen-financiero', dashboardController.getResumenFinanciero);

/**
 * @route   GET /api/dashboard/alertas
 * @desc    Obtener alertas del sistema (stock bajo, alquileres vencidos, etc.)
 * @access  Private
 */
router.get('/alertas', dashboardController.getAlertas);

module.exports = router;