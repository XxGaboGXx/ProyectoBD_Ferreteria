const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'src/services/backupService.js',
    'src/controllers/backupController.js',
    'src/routes/backupRoutes.js',
    'src/config/config.js',
    'src/config/constants.js',
    'src/config/database.js',
    'src/config/utils.js',
    'src/config/index.js',
    'src/middlewares/errorHandler.js',
    'src/middlewares/logger.js',
    'src/middlewares/index.js'
];

console.log('🔍 Verificando estructura de archivos...\n');

let missing = [];
let found = [];

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '../..', file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`);
        found.push(file);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
        missing.push(file);
    }
});

console.log(`\n📊 Resumen:`);
console.log(`   Encontrados: ${found.length}`);
console.log(`   Faltantes: ${missing.length}`);

if (missing.length > 0) {
    console.log(`\n⚠️  Archivos faltantes:`);
    missing.forEach(file => console.log(`   - ${file}`));
    process.exit(1);
} else {
    console.log(`\n✅ Todos los archivos necesarios están presentes`);
}