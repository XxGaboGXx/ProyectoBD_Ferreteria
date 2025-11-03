const compraService = require('../services/compraService');

exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await compraService.getAll(parseInt(page), parseInt(limit), filters);
        res.json({
            success: true,
            message: 'Compras obtenidas correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const result = await compraService.getById(req.params.id);
        res.json({
            success: true,
            message: 'Compra obtenida correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const result = await compraService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Compra creada exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getEstadisticas = async (req, res, next) => {
    try {
        const filters = {
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        };

        const result = await compraService.getEstadisticas(filters);

        res.json({
            success: true,
            message: 'Estadísticas obtenidas correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductosMasComprados = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        };

        const result = await compraService.getProductosMasComprados(limit, filters);

        res.json({
            success: true,
            message: 'Productos más comprados obtenidos correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};