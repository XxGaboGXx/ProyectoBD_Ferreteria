const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.getAll);
router.get('/low-stock', productoController.getLowStock);
router.get('/:id', productoController.getById);
router.post('/', productoController.create);
router.put('/:id', productoController.update);
router.delete('/:id', productoController.delete);
router.post('/:id/adjust-stock', productoController.adjustStock);
router.get('/:id/movimientos', productoController.getMovimientos);

module.exports = router;