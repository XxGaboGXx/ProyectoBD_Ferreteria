const proveedorService = require('../services/proveedorService');
const { utils, constants } = require('../config');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await proveedorService.getAll(parseInt(page), parseInt(limit), filters);
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await proveedorService.getById(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await proveedorService.create(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Proveedor creado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const result = await proveedorService.update(parseInt(req.params.id), req.body);
        res.json(utils.successResponse(result, 'Proveedor actualizado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const result = await proveedorService.delete(parseInt(req.params.id));
        res.json(utils.successResponse(result, 'Proveedor eliminado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getHistorialCompras = async (req, res, next) => {
    try {
        const result = await proveedorService.getHistorialCompras(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getProductos = async (req, res, next) => {
    try {
        const result = await proveedorService.getProductos(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};