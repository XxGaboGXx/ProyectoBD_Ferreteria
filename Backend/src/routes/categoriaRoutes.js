const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Rutas específicas con :id (ANTES de /:id genérico)
router.get('/:id/productos', categoriaController.getProductos);
router.get('/:id/estadisticas', categoriaController.getEstadisticas);

// Lista general
router.get('/', categoriaController.getAll);

// Ruta genérica con :id
router.get('/:id', categoriaController.getById);

// CRUD
router.post('/', categoriaController.create);
router.put('/:id', categoriaController.update);
router.delete('/:id', categoriaController.delete);

module.exports = router;