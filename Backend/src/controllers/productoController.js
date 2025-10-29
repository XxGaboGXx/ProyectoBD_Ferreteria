const productoService = require('../services/productoService');
const { utils, constants } = require('../config');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await productoService.getAll(parseInt(page), parseInt(limit), filters);
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await productoService.getById(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await productoService.create(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Producto creado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const result = await productoService.update(parseInt(req.params.id), req.body);
        res.json(utils.successResponse(result, 'Producto actualizado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const result = await productoService.delete(parseInt(req.params.id));
        res.json(utils.successResponse(result, 'Producto eliminado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const result = await productoService.getLowStock();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.adjustStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cantidad, motivo, userId } = req.body;
        const result = await productoService.adjustStock(
            parseInt(id),
            cantidad,
            motivo,
            userId
        );
        res.json(utils.successResponse(result, 'Stock ajustado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getMovimientos = async (req, res, next) => {
    try {
        const result = await productoService.getMovimientos(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};