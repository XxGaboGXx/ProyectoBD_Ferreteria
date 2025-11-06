const productoService = require('../services/productoService');

/**
 * Obtener todos los productos
 */
exports.getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await productoService.getAll(parseInt(page), parseInt(limit), filters);
        res.json({
            success: true,
            message: 'Productos obtenidos correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener productos con stock bajo
 */
exports.getLowStock = async (req, res, next) => {
    try {
        const result = await productoService.getProductosBajoStock();
        res.json({
            success: true,
            message: 'Productos con stock bajo obtenidos correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener producto por ID
 */
exports.getById = async (req, res, next) => {
    try {
        const result = await productoService.getById(req.params.id);
        res.json({
            success: true,
            message: 'Producto obtenido correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Crear producto
 */
exports.create = async (req, res, next) => {
    try {
        const result = await productoService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar producto
 */
exports.update = async (req, res, next) => {
    try {
        console.log('📥 Controller - Datos recibidos para actualizar:', JSON.stringify({
            id: req.params.id,
            body: req.body
        }, null, 2));
        const result = await productoService.update(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: result
        });
    } catch (error) {
        console.error('❌ Controller - Error en update:', error.message);
        next(error);
    }
};

/**
 * Eliminar producto
 */
exports.delete = async (req, res, next) => {
    try {
        const result = await productoService.delete(req.params.id);
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Ajustar stock del producto
 */
exports.adjustStock = async (req, res, next) => {
    try {
        const result = await productoService.ajustarInventario(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Stock ajustado correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener movimientos de inventario de un producto
 */
exports.getMovimientos = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, tipo, fechaInicio, fechaFin } = req.query;
        
        const filters = {};
        if (tipo) filters.tipo = tipo;
        if (fechaInicio) filters.fechaInicio = fechaInicio;
        if (fechaFin) filters.fechaFin = fechaFin;

        const result = await productoService.getMovimientos(
            req.params.id,
            parseInt(page),
            parseInt(limit),
            filters
        );

        res.json({
            success: true,
            message: 'Movimientos obtenidos correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener estadísticas generales del inventario
 */
exports.getEstadisticas = async (req, res, next) => {
    try {
        const result = await productoService.getEstadisticasInventario();
        res.json({
            success: true,
            message: 'Estadísticas de inventario obtenidas correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener productos por categoría
 */
exports.getByCategoria = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const result = await productoService.getByCategoria(
            req.params.idCategoria,
            parseInt(page),
            parseInt(limit)
        );
        res.json({
            success: true,
            message: 'Productos de la categoría obtenidos correctamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};