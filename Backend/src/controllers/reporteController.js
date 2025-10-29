const reporteService = require('../services/reporteService');
const { utils } = require('../config');

exports.reporteVentas = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Debe proporcionar fechaInicio y fechaFin',
                    example: '?fechaInicio=2025-01-01&fechaFin=2025-12-31'
                }
            });
        }
        
        const result = await reporteService.reporteVentas(
            new Date(fechaInicio),
            new Date(fechaFin)
        );
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.reporteInventario = async (req, res, next) => {
    try {
        const result = await reporteService.reporteInventario();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.reporteClientes = async (req, res, next) => {
    try {
        const result = await reporteService.reporteClientes();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.reporteProductosMasVendidos = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin, limit = 20 } = req.query;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Debe proporcionar fechaInicio y fechaFin'
                }
            });
        }
        
        const result = await reporteService.reporteProductosMasVendidos(
            new Date(fechaInicio),
            new Date(fechaFin),
            parseInt(limit)
        );
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.reporteCompras = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Debe proporcionar fechaInicio y fechaFin'
                }
            });
        }
        
        const result = await reporteService.reporteCompras(
            new Date(fechaInicio),
            new Date(fechaFin)
        );
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.reporteAlquileres = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Debe proporcionar fechaInicio y fechaFin'
                }
            });
        }
        
        const result = await reporteService.reporteAlquileres(
            new Date(fechaInicio),
            new Date(fechaFin)
        );
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};