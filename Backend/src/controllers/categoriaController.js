const BaseService = require('../services/baseService');
const { utils, constants } = require('../config');

const categoriaService = new BaseService('Categoria', 'Id_Categoria');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await categoriaService.getAll(parseInt(page), parseInt(limit), filters);
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await categoriaService.getById(parseInt(req.params.id));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await categoriaService.create(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Categoría creada exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const result = await categoriaService.update(parseInt(req.params.id), req.body);
        res.json(utils.successResponse(result, 'Categoría actualizada exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const result = await categoriaService.delete(parseInt(req.params.id));
        res.json(utils.successResponse(result, 'Categoría eliminada exitosamente'));
    } catch (error) {
        next(error);
    }
};