const express = require('express');
const router = express.Router();
const alquilerController = require('../controllers/alquilerController');

router.post('/', alquilerController.create);
router.get('/activos', alquilerController.getActivos);
router.get('/vencidos', alquilerController.getVencidos);
router.post('/:id/finalizar', alquilerController.finalizar);

module.exports = router;