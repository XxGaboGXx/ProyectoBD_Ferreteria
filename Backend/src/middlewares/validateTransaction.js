const { constants } = require('../config');

/**
 * Valida que los datos de una transacción sean correctos
 */
const validateTransaction = (req, res, next) => {
    const { body } = req;
    const errors = [];

    // Validaciones comunes para transacciones
    if (body.amount !== undefined) {
        if (typeof body.amount !== 'number' || body.amount <= 0) {
            errors.push('El monto debe ser un número mayor a 0');
        }
    }

    if (body.quantity !== undefined) {
        if (!Number.isInteger(body.quantity) || body.quantity <= 0) {
            errors.push('La cantidad debe ser un número entero mayor a 0');
        }
    }

    if (body.date !== undefined) {
        const date = new Date(body.date);
        if (isNaN(date.getTime())) {
            errors.push('La fecha proporcionada no es válida');
        }
    }

    // Si hay errores, retornar
    if (errors.length > 0) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                message: 'Errores de validación',
                details: errors
            }
        });
    }

    next();
};

/**
 * Valida stock disponible antes de una venta o alquiler
 */
const validateStock = async (req, res, next) => {
    try {
        const { getConnection, sql } = require('../config/database');
        const { Id_producto, cantidad } = req.body;

        if (!Id_producto || !cantidad) {
            return next();
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, Id_producto)
            .query('SELECT CantidadActual, Nombre FROM Producto WHERE Id_Producto = @id');

        if (result.recordset.length === 0) {
            return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: {
                    message: 'Producto no encontrado',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        const producto = result.recordset[0];
        
        if (producto.CantidadActual < cantidad) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: constants.ERROR_MESSAGES.INSUFFICIENT_STOCK,
                    code: 'INSUFFICIENT_STOCK',
                    details: {
                        producto: producto.Nombre,
                        disponible: producto.CantidadActual,
                        solicitado: cantidad
                    }
                }
            });
        }

        // Adjuntar información del producto al request
        req.producto = producto;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Valida que exista un registro antes de actualizar o eliminar
 */
const validateExists = (table, idField = 'Id') => {
    return async (req, res, next) => {
        try {
            const { getConnection, sql } = require('../config/database');
            const id = req.params.id;

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT * FROM ${table} WHERE ${idField} = @id`);

            if (result.recordset.length === 0) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: {
                        message: constants.ERROR_MESSAGES.NOT_FOUND,
                        code: 'NOT_FOUND',
                        details: {
                            table: table,
                            id: id
                        }
                    }
                });
            }

            // Adjuntar el registro existente al request
            req.existingRecord = result.recordset[0];
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validateTransaction,
    validateStock,
    validateExists
};