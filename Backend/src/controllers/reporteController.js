const reporteService = require('../services/reporteService');
const pdfService = require('../services/pdfService');

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
     */
    async getProductosMasVendidos(req, res, next) {
        try {
            const { fechaInicio, fechaFin, limit } = req.query;

            const data = await reporteService.getTopProductos(
                fechaInicio ? new Date(fechaInicio) : null,
                fechaFin ? new Date(fechaFin) : null
            );

            res.json({
                success: true,
                data: data.slice(0, parseInt(limit) || 20),
                count: data.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reportes/top-productos
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

   // ============================================
// 📄 MÉTODOS PARA GENERAR PDFs
// ============================================

/**
 * GET /api/reportes/ventas/pdf
 */
async descargarPDFVentas(req, res, next) {
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

        const doc = pdfService.generarPDFVentas(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ventas-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/reportes/compras/pdf
 */
async descargarPDFCompras(req, res, next) {
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

        const doc = pdfService.generarPDFCompras(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=compras-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/reportes/alquileres/pdf
 */
async descargarPDFAlquileres(req, res, next) {
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

        const doc = pdfService.generarPDFAlquileres(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=alquileres-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/reportes/inventario/pdf
 */
async descargarPDFInventario(req, res, next) {
    try {
        const data = await reporteService.reporteInventario();

        const doc = pdfService.generarPDFInventario(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=inventario-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/reportes/productos-mas-vendidos/pdf
 */
async descargarPDFTopProductos(req, res, next) {
    try {
        const { fechaInicio, fechaFin } = req.query;

        const productos = await reporteService.getTopProductos(
            fechaInicio ? new Date(fechaInicio) : null,
            fechaFin ? new Date(fechaFin) : null
        );

        const doc = pdfService.generarPDFTopProductos(
            productos,
            fechaInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            fechaFin || new Date()
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=top-productos-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/reportes/top-clientes/pdf
 */
async descargarPDFTopClientes(req, res, next) {
    try {
        const { fechaInicio, fechaFin } = req.query;

        const clientes = await reporteService.getTopClientes(
            fechaInicio ? new Date(fechaInicio) : null,
            fechaFin ? new Date(fechaFin) : null
        );

        const doc = pdfService.generarPDFTopClientes(
            clientes,
            fechaInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            fechaFin || new Date()
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=top-clientes-${Date.now()}.pdf`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        next(error);
    }
}
}
module.exports = new ReporteController();