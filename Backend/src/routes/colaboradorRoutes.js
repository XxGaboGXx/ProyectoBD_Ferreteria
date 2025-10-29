const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaboradorController');

router.get('/', colaboradorController.getAll);
router.get('/:id', colaboradorController.getById);
router.post('/', colaboradorController.create);
router.put('/:id', colaboradorController.update);
router.delete('/:id', colaboradorController.delete);

module.exports = router;