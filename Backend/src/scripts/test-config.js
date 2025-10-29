const { config, utils, constants } = require('../config');

console.log('🔍 Verificando configuración...\n');

try {
    // Validar variables de entorno
    utils.validateEnvVariables();
    console.log('✅ Variables de entorno validadas');
    
    // Mostrar información de conexión
    console.log('\n📊 Información de conexión:');
    console.log(JSON.stringify(utils.getConnectionInfo(), null, 2));
    
    // Mostrar configuración de backups
    console.log('\n💾 Configuración de backups:');
    console.log(`  - Habilitado: ${config.backup.enabled}`);
    console.log(`  - Ruta: ${config.backup.path}`);
    console.log(`  - Retención: ${config.backup.retention} días`);
    console.log(`  - Intervalo: ${config.backup.autoBackupInterval / (60 * 60 * 1000)} horas`);
    
    // Mostrar configuración de logs
    console.log('\n📝 Configuración de logs:');
    console.log(`  - Habilitado: ${config.logging.enabled}`);
    console.log(`  - Nivel: ${config.logging.level}`);
    console.log(`  - Ruta: ${config.logging.path}`);
    
    // Mostrar constantes
    console.log('\n🔤 Constantes cargadas:');
    console.log(`  - Estados de productos: ${Object.keys(constants.PRODUCT_STATUS).length}`);
    console.log(`  - Estados de ventas: ${Object.keys(constants.SALE_STATUS).length}`);
    console.log(`  - Tipos de pago: ${Object.keys(constants.PAYMENT_TYPE).length}`);
    
    console.log('\n✅ Configuración verificada exitosamente');
} catch (error) {
    console.error('\n❌ Error en la configuración:', error.message);
    process.exit(1);
}