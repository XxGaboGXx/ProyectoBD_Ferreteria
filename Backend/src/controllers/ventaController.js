const ventaService = require('../services/ventaService');

class VentaController {
    async getAll(req, res, next) {
        try {
            const { page = 1, limit = 50, estado, fechaInicio, fechaFin, clienteId } = req.query;
            
            const filters = {};
            if (estado) filters.estado = estado;
            if (fechaInicio) filters.fechaInicio = fechaInicio;
            if (fechaFin) filters.fechaFin = fechaFin;
            if (clienteId) filters.clienteId = parseInt(clienteId);

            const result = await ventaService.getAll(
                parseInt(page),
                parseInt(limit),
                filters
            );

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const venta = await ventaService.getById(req.params.id);
            
            if (!venta) {
                return res.status(404).json({
                    success: false,
                    message: 'Venta no encontrada'
                });
            }

            res.json({
                success: true,
                data: venta
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const nuevaVenta = await ventaService.create(req.body);
            
            res.status(201).json({
                success: true,
                message: 'Venta creada exitosamente',
                data: nuevaVenta
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const ventaActualizada = await ventaService.update(req.params.id, req.body);
            
            res.json({
                success: true,
                message: 'Venta actualizada exitosamente',
                data: ventaActualizada
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await ventaService.delete(req.params.id);
            
            res.json({
                success: true,
                message: 'Venta eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async getDetalles(req, res, next) {
        try {
            const detalles = await ventaService.getDetalles(req.params.id);
            
            res.json({
                success: true,
                data: detalles
            });
        } catch (error) {
            next(error);
        }
    }

    async anularVenta(req, res, next) {
        try {
            const { motivo } = req.body;
            
            const resultado = await ventaService.anularVenta(req.params.id, motivo);
            
            res.json({
                success: true,
                message: 'Venta anulada exitosamente',
                data: resultado
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VentaController();