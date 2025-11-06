const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// ============================================
// CONFIGURACIÓN CON WINDOWS AUTHENTICATION
// ============================================
const config = {
   connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS01;Database=FerreteriaCentral;Trusted_Connection=yes;',
};


let pool = null;

// ============================================
// OBTENER CONEXIÓN
// ============================================
const getConnection = async () => {
    try {
        if (pool && pool.connected) {
            return pool;
        }

        console.log('🔄 Conectando con Windows Authentication...');
        console.log('📍 Servidor:', process.env.DB_SERVER);
        console.log('📁 Base de datos:', process.env.DB_DATABASE);
        
        pool = await sql.connect(config);
        console.log('✅ Conectado exitosamente a SQL Server');
        
        return pool;
    } catch (err) {
        console.error('❌ Error de conexión detallado:', err.message || err);
        throw err;
    }
};

// ============================================
// PROBAR CONEXIÓN
// ============================================
const testConnection = async () => {
    try {
        const connection = await getConnection();
        const result = await connection.request().query('SELECT 1 AS test');
        
        if (result.recordset[0].test === 1) {
            console.log('✅ Prueba de conexión exitosa');
            return true;
        }
        
        throw new Error('Prueba de conexión falló');
    } catch (error) {
        console.error('❌ Error en prueba de conexión:', error.message);
        throw error;
    }
};

// ============================================
// CERRAR CONEXIÓN
// ============================================
const closeConnection = async () => {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✅ Conexión cerrada');
        }
    } catch (err) {
        console.error('❌ Error al cerrar conexión:', err);
    }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = { 
    getConnection, 
    closeConnection, 
    testConnection,
    sql 
};