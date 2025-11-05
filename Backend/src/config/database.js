const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS01;Database=FerreteriaCentral;Trusted_Connection=yes;',
};


let pool;

const getConnection = async () => {
    try {
        if (!pool) {
            console.log('🔄 Conectando con Windows Authentication...');
            console.log('Connection String:', config.connectionString);
            
            pool = await sql.connect(config);
            console.log('✅ Conectado exitosamente a FerreteriaCentral');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error detallado:', err.message || err);
        throw err;
    }
};

const closeConnection = async () => {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('Conexión cerrada');
        }
    } catch (err) {
        console.error('Error al cerrar:', err);
    }
};

module.exports = { getConnection, closeConnection, sql };