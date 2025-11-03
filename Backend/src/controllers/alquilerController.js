const alquilerService = require('../services/alquilerService');
const { utils, constants } = require('../config');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await alquilerService.getAll(parseInt(page), parseInt(limit), filters);
        res.json(utils.successResponse(result, 'Alquileres obtenidos correctamente'));
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await alquilerService.getById(parseInt(req.params.id));
        res.json(utils.successResponse(result, 'Alquiler obtenido correctamente'));
    } catch (error) {
        next(error);
    }
};

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
        const userId = req.body.userId || 'SYSTEM';
        const result = await alquilerService.finalizarAlquiler(parseInt(req.params.id), userId);
        res.json(utils.successResponse(result, 'Alquiler finalizado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.extender = async (req, res, next) => {
    try {
        const { diasAdicionales, userId = 'SYSTEM' } = req.body;
        
        if (!diasAdicionales || diasAdicionales <= 0) {
            return res.status(400).json(utils.errorResponse('Debe especificar días adicionales válidos'));
        }

        const result = await alquilerService.extenderAlquiler(
            parseInt(req.params.id),
            parseInt(diasAdicionales),
            userId
        );
        res.json(utils.successResponse(result, 'Alquiler extendido exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.cancelar = async (req, res, next) => {
    try {
        const { motivo, userId = 'SYSTEM' } = req.body;
        
        if (!motivo) {
            return res.status(400).json(utils.errorResponse('Debe especificar un motivo de cancelación'));
        }

        const result = await alquilerService.cancelarAlquiler(
            parseInt(req.params.id),
            motivo,
            userId
        );
        res.json(utils.successResponse(result, 'Alquiler cancelado exitosamente'));
    } catch (error) {
        next(error);
    }
};

exports.getActivos = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const result = await alquilerService.getAlquileresActivos(parseInt(page), parseInt(limit));
        res.json(utils.successResponse(result, 'Alquileres activos obtenidos correctamente'));
    } catch (error) {
        next(error);
    }
};

exports.getVencidos = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const result = await alquilerService.getAlquileresVencidos(parseInt(page), parseInt(limit));
        res.json(utils.successResponse(result, 'Alquileres vencidos obtenidos correctamente'));
    } catch (error) {
        next(error);
    }
};

exports.getEstadisticas = async (req, res, next) => {
    try {
        const result = await alquilerService.getEstadisticas();
        res.json(utils.successResponse(result, 'Estadísticas obtenidas correctamente'));
    } catch (error) {
        next(error);
    }
};

exports.getHistorialCliente = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const result = await alquilerService.getHistorialCliente(
            parseInt(req.params.clienteId),
            parseInt(page),
            parseInt(limit)
        );
        res.json(utils.successResponse(result, 'Historial del cliente obtenido correctamente'));
    } catch (error) {
        next(error);
    }
};