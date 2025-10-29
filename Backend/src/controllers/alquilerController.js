const alquilerService = require('../services/alquilerService');
const { utils, constants } = require('../config');

exports.create = async (req, res, next) => {
    try {
        const result = await alquilerService.createAlquiler(req.body);
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Alquiler creado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

exports.finalizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.body.userId || 'SYSTEM';
        const result = await alquilerService.finalizarAlquiler(parseInt(id), userId);
        res.json(utils.successResponse(result, 'Alquiler finalizado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getActivos = async (req, res, next) => {
    try {
        const result = await alquilerService.getAlquileresActivos();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getVencidos = async (req, res, next) => {
    try {
        const result = await alquilerService.getAlquileresVencidos();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};