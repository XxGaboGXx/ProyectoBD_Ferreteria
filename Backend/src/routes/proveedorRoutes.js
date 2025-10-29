const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.get('/', proveedorController.getAll);
router.get('/:id', proveedorController.getById);
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);
router.delete('/:id', proveedorController.delete);
router.get('/:id/historial', proveedorController.getHistorialCompras);
router.get('/:id/productos', proveedorController.getProductos);

module.exports = router;