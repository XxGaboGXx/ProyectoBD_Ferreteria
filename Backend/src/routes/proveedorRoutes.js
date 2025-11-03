const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

// Rutas con :id y acción específica (ANTES de /:id)
router.get('/:id/historial-compras', proveedorController.getHistorialCompras);
router.get('/:id/productos', proveedorController.getProductos);
router.get('/:id/estadisticas', proveedorController.getEstadisticas);

// Lista general
router.get('/', proveedorController.getAll);

// Ruta genérica con :id
router.get('/:id', proveedorController.getById);

// CRUD
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);
router.delete('/:id', proveedorController.delete);

module.exports = router;