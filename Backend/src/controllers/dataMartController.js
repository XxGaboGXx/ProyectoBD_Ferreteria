const dataMartService = require('../services/dataMartService');
const { utils } = require('../config');

class DataMartController {
    /**
     * GET /api/datamart/etl
     * Ejecutar ETL completo
     */
    async ejecutarETL(req, res, next) {
        try {
            const { fechaInicio, fechaFin } = req.query;
            
            const resultado = await dataMartService.ejecutarETLCompleto(
                fechaInicio ? new Date(fechaInicio) : null,
                fechaFin ? new Date(fechaFin) : null
            );

            res.json(utils.successResponse(resultado, 'ETL ejecutado correctamente'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/datamart/actualizar
     * Actualizar DataMart con compras de hoy
     */
    async actualizar(req, res, next) {
        try {
            const resultado = await dataMartService.actualizarComprasHoy();

            res.json(utils.successResponse(resultado, 'DataMart actualizado correctamente'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/top-proveedores
     */
    async getTopProveedores(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const data = await dataMartService.getTopProveedores(limit);

            res.json(utils.successResponse(data, 'Top proveedores obtenidos correctamente'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/productos-mas-comprados
     */
    async getProductosMasComprados(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const data = await dataMartService.getProductosMasComprados(limit);

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/alertas-inventario
     */
    async getAlertasInventario(req, res, next) {
        try {
            const data = await dataMartService.getAlertasInventario();

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/rentabilidad
     */
    async getRentabilidad(req, res, next) {
        try {
            const data = await dataMartService.getRentabilidadProductos();

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/compras-por-mes
     */
    async getComprasPorMes(req, res, next) {
        try {
            const anio = req.query.anio ? parseInt(req.query.anio) : null;
            const data = await dataMartService.getComprasPorMes(anio);

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/tendencias
     */
    async getTendencias(req, res, next) {
        try {
            const data = await dataMartService.getTendenciasTrimestrales();

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/analisis-categoria
     */
    async getAnalisisCategoria(req, res, next) {
        try {
            const data = await dataMartService.getAnalisisPorCategoria();

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/datamart/estadisticas
     */
    async getEstadisticas(req, res, next) {
        try {
            const data = await dataMartService.getEstadisticas();

            res.json(utils.successResponse(data));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DataMartController();

