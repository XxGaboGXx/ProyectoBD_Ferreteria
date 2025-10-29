const ventaService = require('../services/ventaService');
const { utils, constants } = require('../config');

/**
 * Crear una nueva venta
 */
exports.createVenta = async (req, res, next) => {
    try {
        const result = await ventaService.createVenta(req.body);
        
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Venta creada exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Cancelar una venta
 */
exports.cancelVenta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.body.userId || 'SYSTEM';
        
        const result = await ventaService.cancelVenta(parseInt(id), userId);
        
        res.json(
            utils.successResponse(result, 'Venta cancelada exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener detalles de una venta
 */
exports.getVentaDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ventaService.getVentaDetails(parseInt(id));
        
        res.json(
            utils.successResponse(result)
        );
    } catch (error) {
        next(error);
    }
};