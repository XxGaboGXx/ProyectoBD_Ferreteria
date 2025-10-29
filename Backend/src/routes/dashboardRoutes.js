const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard principal
router.get('/summary', dashboardController.getSummary);

// Gráficas y análisis
router.get('/ventas-por-dia', dashboardController.getVentasPorDia);
router.get('/ventas-por-categoria', dashboardController.getVentasPorCategoria);
router.get('/ventas-por-metodo-pago', dashboardController.getVentasPorMetodoPago);

// Top rankings
router.get('/top-clientes', dashboardController.getTopClientes);
router.get('/rendimiento-colaboradores', dashboardController.getRendimientoColaboradores);

// Inventario
router.get('/analisis-inventario', dashboardController.getAnalisisInventario);
router.get('/movimientos-recientes', dashboardController.getMovimientosRecientes);

// Financiero
router.get('/resumen-financiero', dashboardController.getResumenFinanciero);

// Alertas
router.get('/alertas', dashboardController.getAlertas);

module.exports = router;