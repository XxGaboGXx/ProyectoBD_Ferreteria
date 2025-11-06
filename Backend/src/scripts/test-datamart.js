const { getConnection, sql } = require('../config/database');

/**
 * Script de prueba para verificar la conexión y funcionamiento del DataMart
 */
async function testDataMart() {
    console.log('================================================');
    console.log('PRUEBA DE CONEXIÓN Y FUNCIONAMIENTO DEL DATAMART');
    console.log('================================================\n');

    let pool = null;

    try {
        // 1. Probar conexión básica
        console.log('1️⃣ Probando conexión a la base de datos...');
        pool = await getConnection();
        const testResult = await pool.request().query('SELECT DB_NAME() AS database_name, @@VERSION AS version');
        console.log('✅ Conexión exitosa');
        console.log(`   Base de datos: ${testResult.recordset[0].database_name}\n`);

        // 2. Verificar existencia del esquema DM
        console.log('2️⃣ Verificando existencia del esquema DM...');
        const schemaCheck = await pool.request().query(`
            SELECT COUNT(*) AS count 
            FROM sys.schemas 
            WHERE name = 'DM'
        `);
        
        if (schemaCheck.recordset[0].count === 0) {
            console.error('❌ ERROR: El esquema DM no existe');
            console.log('   Solución: Ejecutar DataMart_Compras.sql primero\n');
            return;
        }
        console.log('✅ Esquema DM existe\n');

        // 3. Verificar existencia de tablas principales
        console.log('3️⃣ Verificando tablas del DataMart...');
        const tablesCheck = await pool.request().query(`
            SELECT name 
            FROM sys.tables 
            WHERE schema_id = SCHEMA_ID('DM')
            ORDER BY name
        `);
        
        const expectedTables = ['Dim_Tiempo', 'Dim_Proveedor', 'Dim_Categoria', 'Dim_Producto', 'Fact_Compras'];
        const existingTables = tablesCheck.recordset.map(t => t.name);
        const missingTables = expectedTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.error(`❌ ERROR: Faltan tablas: ${missingTables.join(', ')}`);
            console.log('   Solución: Ejecutar DataMart_Compras.sql completamente\n');
            return;
        }
        console.log(`✅ Todas las tablas existen: ${existingTables.join(', ')}\n`);

        // 4. Verificar existencia de vistas
        console.log('4️⃣ Verificando vistas analíticas...');
        const viewsCheck = await pool.request().query(`
            SELECT name 
            FROM sys.views 
            WHERE schema_id = SCHEMA_ID('DM')
            ORDER BY name
        `);
        
        const expectedViews = [
            'vw_Compras_Por_Mes',
            'vw_Top_Proveedores',
            'vw_Productos_Mas_Comprados',
            'vw_Analisis_Por_Categoria',
            'vw_Tendencias_Trimestrales',
            'vw_Rentabilidad_Productos',
            'vw_Alertas_Inventario'
        ];
        const existingViews = viewsCheck.recordset.map(v => v.name);
        const missingViews = expectedViews.filter(v => !existingViews.includes(v));

        if (missingViews.length > 0) {
            console.warn(`⚠️  ADVERTENCIA: Faltan vistas: ${missingViews.join(', ')}`);
        } else {
            console.log(`✅ Todas las vistas existen: ${existingViews.length} vistas\n`);
        }

        // 5. Verificar procedimientos almacenados ETL
        console.log('5️⃣ Verificando procedimientos almacenados ETL...');
        const spCheck = await pool.request().query(`
            SELECT name 
            FROM sys.procedures 
            WHERE schema_id = SCHEMA_ID('DM')
            AND name LIKE 'sp_%'
            ORDER BY name
        `);
        
        const expectedSPs = [
            'sp_Cargar_Dim_Tiempo',
            'sp_Cargar_Dim_Proveedor',
            'sp_Cargar_Dim_Categoria',
            'sp_Cargar_Dim_Producto',
            'sp_Cargar_Fact_Compras',
            'sp_ETL_DataMart_Completo'
        ];
        const existingSPs = spCheck.recordset.map(sp => sp.name);
        const missingSPs = expectedSPs.filter(sp => !existingSPs.includes(sp));

        if (missingSPs.length > 0) {
            console.error(`❌ ERROR: Faltan procedimientos: ${missingSPs.join(', ')}`);
            console.log('   Solución: Ejecutar DataMart_Compras.sql completamente\n');
            return;
        }
        console.log(`✅ Todos los procedimientos ETL existen: ${existingSPs.length} SPs\n`);

        // 6. Verificar datos en dimensiones
        console.log('6️⃣ Verificando datos en dimensiones...');
        const dimCounts = await pool.request().query(`
            SELECT 
                'Dim_Tiempo' AS Tabla, COUNT(*) AS Registros FROM DM.Dim_Tiempo
            UNION ALL
            SELECT 'Dim_Proveedor', COUNT(*) FROM DM.Dim_Proveedor
            UNION ALL
            SELECT 'Dim_Categoria', COUNT(*) FROM DM.Dim_Categoria
            UNION ALL
            SELECT 'Dim_Producto', COUNT(*) FROM DM.Dim_Producto
            UNION ALL
            SELECT 'Fact_Compras', COUNT(*) FROM DM.Fact_Compras
        `);

        console.log('   Registros en tablas:');
        dimCounts.recordset.forEach(row => {
            const status = row.Registros > 0 ? '✅' : '⚠️';
            console.log(`   ${status} ${row.Tabla}: ${row.Registros} registros`);
        });
        console.log('');

        // 7. Probar consulta a una vista
        console.log('7️⃣ Probando consulta a vista vw_Top_Proveedores...');
        try {
            const viewTest = await pool.request().query(`
                SELECT TOP 1 * FROM DM.vw_Top_Proveedores
            `);
            console.log('✅ Vista consultable correctamente');
            if (viewTest.recordset.length > 0) {
                console.log(`   Ejemplo: ${viewTest.recordset[0].Proveedor} - ${viewTest.recordset[0].MontoTotal}`);
            }
        } catch (error) {
            console.error(`❌ ERROR consultando vista: ${error.message}`);
            console.log('   Posible causa: El DataMart no ha sido inicializado');
            console.log('   Solución: Ejecutar DataMart_Inicializacion.sql\n');
            return;
        }
        console.log('');

        // 8. Probar ejecución de SP de estadísticas
        console.log('8️⃣ Probando procedimiento sp_Estadisticas_DataMart...');
        try {
            const statsResult = await pool.request().execute('DM.sp_Estadisticas_DataMart');
            console.log('✅ Procedimiento ejecutable correctamente');
            if (statsResult.recordsets[0] && statsResult.recordsets[0].length > 0) {
                console.log(`   Tablas encontradas: ${statsResult.recordsets[0].length}`);
            }
        } catch (error) {
            console.error(`❌ ERROR ejecutando procedimiento: ${error.message}`);
            return;
        }
        console.log('');

        // 9. Verificar integridad referencial
        console.log('9️⃣ Verificando integridad referencial...');
        const fkCheck = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM sys.foreign_keys
            WHERE schema_id = SCHEMA_ID('DM')
        `);
        
        if (fkCheck.recordset[0].count >= 4) {
            console.log(`✅ Integridad referencial configurada: ${fkCheck.recordset[0].count} FKs\n`);
        } else {
            console.warn(`⚠️  Pocas claves foráneas: ${fkCheck.recordset[0].count} FKs\n`);
        }

        // Resumen final
        console.log('================================================');
        console.log('✅ TODAS LAS PRUEBAS PASARON');
        console.log('================================================');
        console.log('\nEl DataMart está correctamente configurado y listo para usar.');
        console.log('\nPróximos pasos:');
        console.log('1. Si no hay datos, ejecutar: DataMart_Inicializacion.sql');
        console.log('2. Probar endpoints del backend: GET /api/datamart/top-proveedores');
        console.log('3. Integrar con el frontend usando dataMartService.ts\n');

    } catch (error) {
        console.error('\n❌ ERROR GENERAL:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.message.includes('Invalid object name')) {
            console.log('\n💡 Solución: El DataMart no está creado. Ejecutar:');
            console.log('   1. DataMart_Compras.sql');
            console.log('   2. DataMart_Inicializacion.sql');
        } else if (error.message.includes('Cannot open database')) {
            console.log('\n💡 Solución: Verificar que la base de datos FerreteriaCentral existe');
        } else if (error.message.includes('Login failed')) {
            console.log('\n💡 Solución: Verificar permisos de Windows Authentication');
        }
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (err) {
                // Ignorar errores al cerrar
            }
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testDataMart()
        .then(() => {
            console.log('\n✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Prueba falló:', error);
            process.exit(1);
        });
}

module.exports = { testDataMart };

