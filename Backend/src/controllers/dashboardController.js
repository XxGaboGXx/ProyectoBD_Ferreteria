const dashboardService = require('../services/dashboardService');
const { utils } = require('../config');

exports.getSummary = async (req, res, next) => {
    try {
        const result = await dashboardService.getDashboardSummary();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getVentasPorDia = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const result = await dashboardService.getVentasPorDia(parseInt(days));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getVentasPorCategoria = async (req, res, next) => {
    try {
        const result = await dashboardService.getVentasPorCategoria();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getVentasPorMetodoPago = async (req, res, next) => {
    try {
        const result = await dashboardService.getVentasPorMetodoPago();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getTopClientes = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        const result = await dashboardService.getTopClientes(parseInt(limit));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getRendimientoColaboradores = async (req, res, next) => {
    try {
        const result = await dashboardService.getRendimientoColaboradores();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getAnalisisInventario = async (req, res, next) => {
    try {
        const result = await dashboardService.getAnalisisInventario();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getMovimientosRecientes = async (req, res, next) => {
    try {
        const { limit = 20 } = req.query;
        const result = await dashboardService.getMovimientosRecientes(parseInt(limit));
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getResumenFinanciero = async (req, res, next) => {
    try {
        const result = await dashboardService.getResumenFinanciero();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};

exports.getAlertas = async (req, res, next) => {
    try {
        const result = await dashboardService.getAlertas();
        res.json(utils.successResponse(result));
    } catch (error) {
        next(error);
    }
};