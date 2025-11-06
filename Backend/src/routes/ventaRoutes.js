const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// ⚠️ ORDEN CORRECTO: Rutas específicas ANTES de rutas genéricas

// 1. Rutas específicas sin parámetros (PRIMERO)
router.get('/estadisticas', ventaController.getEstadisticas);
router.get('/productos-mas-vendidos', ventaController.getProductosMasVendidos);

// 2. Lista general
router.get('/', ventaController.getAll);

// 3. Rutas con :id y acción específica (ANTES de /:id)
router.get('/:id/detalles', ventaController.getDetalles);
router.patch('/:id/cancelar', ventaController.cancelarVenta);

// 4. Ruta genérica con :id (DESPUÉS de las rutas con sufijo)
router.get('/:id', ventaController.getById);

// 5. CRUD operations
router.post('/', ventaController.create);
router.put('/:id', ventaController.update);

module.exports = router;