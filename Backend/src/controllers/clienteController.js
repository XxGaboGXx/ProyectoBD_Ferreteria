const clienteService = require('../services/clienteService');
const { utils, constants } = require('../config');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await clienteService.getAll(parseInt(page), parseInt(limit), filters);
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await clienteService.getById(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getByCedula = async (req, res, next) => {
    try {
        const result = await clienteService.getByCedula(req.params.cedula);
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await clienteService.create(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Cliente creado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const result = await clienteService.update(parseInt(req.params.id), req.body);
        res.json(utils.successResponse(result, 'Cliente actualizado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const result = await clienteService.delete(parseInt(req.params.id));
        res.json(utils.successResponse(result, 'Cliente eliminado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getHistorialCompras = async (req, res, next) => {
    try {
        const result = await clienteService.getHistorialCompras(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getEstadisticas = async (req, res, next) => {
    try {
        const result = await clienteService.getEstadisticas(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};