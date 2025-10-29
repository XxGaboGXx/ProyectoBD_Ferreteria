module.exports = {
    // Estados de productos
    PRODUCT_STATUS: {
        ACTIVE: 'ACTIVO',
        INACTIVE: 'INACTIVO',
        DISCONTINUED: 'DESCONTINUADO'
    },
    
    // Estados de ventas
    SALE_STATUS: {
        PENDING: 'PENDIENTE',
        COMPLETED: 'COMPLETADA',
        CANCELLED: 'CANCELADA',
        REFUNDED: 'DEVUELTA'
    },
    
    // Estados de compras
    PURCHASE_STATUS: {
        PENDING: 'PENDIENTE',
        RECEIVED: 'RECIBIDA',
        PARTIAL: 'PARCIAL',
        CANCELLED: 'CANCELADA'
    },
    
    // Estados de alquileres
    RENTAL_STATUS: {
        ACTIVE: 'ACTIVO',
        RETURNED: 'DEVUELTO',
        OVERDUE: 'ATRASADO',
        LOST: 'EXTRAVIADO'
    },
    
    // Tipos de movimiento
    MOVEMENT_TYPE: {
        ENTRY: 'ENTRADA',
        EXIT: 'SALIDA',
        TRANSFER: 'TRANSFERENCIA',
        ADJUSTMENT: 'AJUSTE'
    },
    
    // Tipos de pago
    PAYMENT_TYPE: {
        CASH: 'EFECTIVO',
        CARD: 'TARJETA',
        TRANSFER: 'TRANSFERENCIA',
        CHECK: 'CHEQUE',
        CREDIT: 'CREDITO'
    },
    
    // Roles de colaboradores
    EMPLOYEE_ROLE: {
        ADMIN: 'ADMINISTRADOR',
        CASHIER: 'CAJERO',
        WAREHOUSE: 'ALMACEN',
        SALES: 'VENDEDOR',
        MANAGER: 'GERENTE'
    },
    
    // Mensajes de error comunes
    ERROR_MESSAGES: {
        NOT_FOUND: 'Recurso no encontrado',
        VALIDATION_ERROR: 'Error de validación',
        DUPLICATE_ENTRY: 'El registro ya existe',
        INSUFFICIENT_STOCK: 'Stock insuficiente',
        UNAUTHORIZED: 'No autorizado',
        FORBIDDEN: 'Acceso denegado',
        SERVER_ERROR: 'Error interno del servidor',
        DATABASE_ERROR: 'Error de base de datos',
        TRANSACTION_FAILED: 'La transacción falló'
    },
    
    // Mensajes de éxito comunes
    SUCCESS_MESSAGES: {
        CREATED: 'Registro creado exitosamente',
        UPDATED: 'Registro actualizado exitosamente',
        DELETED: 'Registro eliminado exitosamente',
        BACKUP_CREATED: 'Backup creado exitosamente',
        BACKUP_RESTORED: 'Backup restaurado exitosamente'
    },
    
    // Códigos de respuesta HTTP
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },
    
    // Configuración de tabla de bitácora
    BITACORA_ACTIONS: {
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        SELECT: 'SELECT'
    },
    
    BITACORA_TABLES: {
        PRODUCTO: 'Producto',
        VENTA: 'Venta',
        COMPRA: 'Compra',
        CLIENTE: 'Cliente',
        PROVEEDOR: 'Proveedor',
        ALQUILER: 'Alquiler',
        COLABORADOR: 'Colaborador'
    }
};