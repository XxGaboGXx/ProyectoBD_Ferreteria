const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.post('/', compraController.create);
router.get('/:id', compraController.getById);

module.exports = router;