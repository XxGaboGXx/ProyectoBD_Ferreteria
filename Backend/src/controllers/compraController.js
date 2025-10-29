const compraService = require('../services/compraService');
const { utils, constants } = require('../config');

exports.create = async (req, res, next) => {
    try {
        const result = await compraService.createCompra(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Compra creada exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await compraService.getCompraDetails(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};