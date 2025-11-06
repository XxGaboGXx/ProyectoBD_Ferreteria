const express = require('express');
const router = express.Router();
const dataMartController = require('../controllers/dataMartController');

// Rutas del DataMart
router.get('/etl', dataMartController.ejecutarETL.bind(dataMartController));
router.post('/actualizar', dataMartController.actualizar.bind(dataMartController));
router.get('/top-proveedores', dataMartController.getTopProveedores.bind(dataMartController));
router.get('/productos-mas-comprados', dataMartController.getProductosMasComprados.bind(dataMartController));
router.get('/alertas-inventario', dataMartController.getAlertasInventario.bind(dataMartController));
router.get('/rentabilidad', dataMartController.getRentabilidad.bind(dataMartController));
router.get('/compras-por-mes', dataMartController.getComprasPorMes.bind(dataMartController));
router.get('/tendencias', dataMartController.getTendencias.bind(dataMartController));
router.get('/analisis-categoria', dataMartController.getAnalisisCategoria.bind(dataMartController));
router.get('/estadisticas', dataMartController.getEstadisticas.bind(dataMartController));

module.exports = router;

