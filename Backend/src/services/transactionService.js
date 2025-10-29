const { getConnection, sql } = require('../config/database');
const { config } = require('../config');

class TransactionService {
    /**
     * Ejecuta una operación dentro de una transacción
     * @param {Function} operation - Función async que recibe (transaction, request)
     * @param {String} isolationLevel - Nivel de aislamiento (opcional)
     * @returns {Promise<any>} - Resultado de la operación
     */
    async executeTransaction(operation, isolationLevel = null) {
        const pool = await getConnection();
        const transaction = pool.transaction();
        
        try {
            // Iniciar transacción con nivel de aislamiento específico
            const level = isolationLevel || config.transactions.isolationLevel;
            await transaction.begin(this.getIsolationLevel(level));
            
            console.log(`🔄 Transacción iniciada (${level})`);
            
            // Crear request asociado a la transacción
            const request = transaction.request();
            
            // Ejecutar la operación
            const result = await operation(transaction, request);
            
            // Commit si todo salió bien
            await transaction.commit();
            console.log('✅ Transacción confirmada (COMMIT)');
            
            return result;
        } catch (error) {
            // Rollback en caso de error
            try {
                await transaction.rollback();
                console.log('⚠️  Transacción revertida (ROLLBACK)');
            } catch (rollbackError) {
                console.error('❌ Error al hacer rollback:', rollbackError);
            }
            
            throw error;
        }
    }

    /**
     * Convierte string de nivel de aislamiento a constante de mssql
     */
    getIsolationLevel(level) {
        const levels = {
            'READ_UNCOMMITTED': sql.ISOLATION_LEVEL.READ_UNCOMMITTED,
            'READ_COMMITTED': sql.ISOLATION_LEVEL.READ_COMMITTED,
            'REPEATABLE_READ': sql.ISOLATION_LEVEL.REPEATABLE_READ,
            'SERIALIZABLE': sql.ISOLATION_LEVEL.SERIALIZABLE,
            'SNAPSHOT': sql.ISOLATION_LEVEL.SNAPSHOT
        };
        
        return levels[level] || sql.ISOLATION_LEVEL.READ_COMMITTED;
    }

    /**
     * Ejecuta múltiples operaciones en una sola transacción
     */
    async executeMultiple(operations) {
        return this.executeTransaction(async (transaction, request) => {
            const results = [];
            
            for (const operation of operations) {
                const result = await operation(transaction, request);
                results.push(result);
            }
            
            return results;
        });
    }

    /**
     * Ejecuta una transacción con retry automático en caso de deadlock
     */
    async executeWithRetry(operation, maxRetries = 3, isolationLevel = null) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.executeTransaction(operation, isolationLevel);
            } catch (error) {
                lastError = error;
                
                // Verificar si es un deadlock (error 1205)
                if (error.number === 1205 && attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`⚠️  Deadlock detectado. Reintentando en ${delay}ms... (Intento ${attempt}/${maxRetries})`);
                    await this.sleep(delay);
                    continue;
                }
                
                throw error;
            }
        }
        
        throw lastError;
    }

    /**
     * Función auxiliar para esperar
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Registra una operación en la bitácora
     */
    async logToBitacora(transaction, request, tableName, action, recordId, userId = null) {
        try {
            await request
                .input('tabla', sql.VarChar, tableName)
                .input('accion', sql.VarChar, action)
                .input('id_registro', sql.Int, recordId)
                .input('usuario', sql.VarChar, userId || 'SYSTEM')
                .query(`
                    INSERT INTO BitacoraProducto 
                    (Tabla, Accion, Id_Registro, Usuario, Fecha)
                    VALUES 
                    (@tabla, @accion, @id_registro, @usuario, GETDATE())
                `);
            
            console.log(`📝 Registrado en bitácora: ${action} en ${tableName}`);
        } catch (error) {
            console.error('⚠️  Error al registrar en bitácora:', error.message);
            // No lanzar error para no afectar la transacción principal
        }
    }

    /**
     * Valida que exista stock suficiente para una venta
     */
    async validateStock(transaction, request, productId, quantity) {
        const result = await request
            .input('productId', sql.Int, productId)
            .query(`
                SELECT 
                    Id_Producto,
                    Nombre,
                    CantidadActual,
                    StockMinimo
                FROM Producto 
                WHERE Id_Producto = @productId
            `);
        
        if (result.recordset.length === 0) {
            throw new Error(`Producto con ID ${productId} no encontrado`);
        }
        
        const product = result.recordset[0];
        
        if (product.CantidadActual < quantity) {
            throw new Error(
                `Stock insuficiente para ${product.Nombre}. ` +
                `Disponible: ${product.CantidadActual}, Solicitado: ${quantity}`
            );
        }
        
        return product;
    }

    /**
     * Actualiza el stock de un producto
     */
    async updateStock(transaction, request, productId, quantityChange, movementType) {
        // Actualizar cantidad
        await request
            .input('productId', sql.Int, productId)
            .input('change', sql.Int, quantityChange)
            .query(`
                UPDATE Producto 
                SET CantidadActual = CantidadActual + @change,
                    FechaActualizacion = GETDATE()
                WHERE Id_Producto = @productId
            `);
        
        // Registrar movimiento de stock
        await request
            .input('movType', sql.VarChar, movementType)
            .input('quantity', sql.Int, Math.abs(quantityChange))
            .query(`
                INSERT INTO MovimientoStock 
                (Id_Producto, TipoMovimiento, Cantidad, Fecha)
                VALUES 
                (@productId, @movType, @quantity, GETDATE())
            `);
        
        console.log(`📦 Stock actualizado para producto ${productId}: ${quantityChange > 0 ? '+' : ''}${quantityChange}`);
    }

    /**
     * Verifica alertas de stock bajo
     */
    async checkStockAlerts(transaction, request, productId) {
        const result = await request
            .input('productId', sql.Int, productId)
            .query(`
                SELECT 
                    Id_Producto,
                    Nombre,
                    CantidadActual,
                    StockMinimo
                FROM Producto 
                WHERE Id_Producto = @productId
                AND CantidadActual <= StockMinimo
            `);
        
        if (result.recordset.length > 0) {
            const product = result.recordset[0];
            console.log(`⚠️  ALERTA: Stock bajo para ${product.Nombre} (Actual: ${product.CantidadActual}, Mínimo: ${product.StockMinimo})`);
            return {
                alert: true,
                product: product
            };
        }
        
        return { alert: false };
    }

    /**
     * Calcula totales de una venta o compra
     */
    calculateTotals(items) {
        const subtotal = items.reduce((sum, item) => {
            return sum + (item.precio * item.cantidad);
        }, 0);
        
        const descuento = items.reduce((sum, item) => {
            return sum + ((item.descuento || 0) * item.cantidad);
        }, 0);
        
        const subtotalConDescuento = subtotal - descuento;
        const impuesto = subtotalConDescuento * 0.13; // IVA 13%
        const total = subtotalConDescuento + impuesto;
        
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            descuento: parseFloat(descuento.toFixed(2)),
            subtotalConDescuento: parseFloat(subtotalConDescuento.toFixed(2)),
            impuesto: parseFloat(impuesto.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }

    /**
     * Valida los datos de una transacción
     */
    validateTransactionData(data, requiredFields) {
        const missing = [];
        
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
        }
    }
}

// Exportar como singleton
module.exports = new TransactionService();