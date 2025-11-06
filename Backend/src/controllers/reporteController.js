const reporteService = require('../services/reporteService');

class ReporteController {
    /**
     * GET /api/reportes/ventas
     */
    async getReporteVentas(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'fechaInicio y fechaFin son requeridos'
                });
            }

            const data = await reporteService.reporteVentas(
                new Date(fechaInicio),
                new Date(fechaFin)
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/compras
     */
    async getReporteCompras(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'fechaInicio y fechaFin son requeridos'
                });
            }

            const data = await reporteService.reporteCompras(
                new Date(fechaInicio),
                new Date(fechaFin)
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/alquileres
     */
    async getReporteAlquileres(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'fechaInicio y fechaFin son requeridos'
                });
            }

            const data = await reporteService.reporteAlquileres(
                new Date(fechaInicio),
                new Date(fechaFin)
            );

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/inventario
     */
    async getReporteInventario(req, res, next) {
        try {
            const data = await reporteService.reporteInventario();

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/clientes
     */
    async getReporteClientes(req, res, next) {
        try {
            const data = await reporteService.reporteClientes();

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/productos-mas-vendidos
     * ✅ CORREGIDO: Ahora usa getTopProductos
     */
    async getProductosMasVendidos(req, res, next) {
        try {
            const { fechaInicio, fechaFin, limit } = req.query;

            // Usar getTopProductos en lugar de reporteProductosMasVendidos
            const data = await reporteService.getTopProductos(
                fechaInicio ? new Date(fechaInicio) : null,
                fechaFin ? new Date(fechaFin) : null
            );

            res.json({
                success: true,
                data: data.slice(0, parseInt(limit) || 20), // Limitar resultados
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/top-productos
     * ✅ NUEVO ENDPOINT
     */
    async getTopProductos(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;

            const data = await reporteService.getTopProductos(
                fechaInicio ? new Date(fechaInicio) : null,
                fechaFin ? new Date(fechaFin) : null
            );

            res.json({
                success: true,
                data,
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/top-clientes
     * ✅ NUEVO ENDPOINT
     */
    async getTopClientes(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;

            const data = await reporteService.getTopClientes(
                fechaInicio ? new Date(fechaInicio) : null,
                fechaFin ? new Date(fechaFin) : null
            );

            res.json({
                success: true,
                data,
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/bajo-stock
     */
    async getProductosBajoStock(req, res, next) {
        try {
            const data = await reporteService.getProductosBajoStock();

            res.json({
                success: true,
                data,
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/ventas-por-periodo
     */
    async getVentasPorPeriodo(req, res, next) {
        try {
            const { fechaInicio, fechaFin, tipoAgrupacion } = req.query;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'fechaInicio y fechaFin son requeridos'
                });
            }

            const data = await reporteService.getVentasPorPeriodo(
                new Date(fechaInicio),
                new Date(fechaFin),
                tipoAgrupacion || 'Dia'
            );

            res.json({
                success: true,
                data,
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReporteController();