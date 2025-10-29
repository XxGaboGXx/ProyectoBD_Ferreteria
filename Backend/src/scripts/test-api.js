const axios = require('axios');

const baseUrl = 'http://localhost:3000';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

async function testEndpoint(name, method, url, data = null) {
    try {
        const config = {
            method,
            url: `${baseUrl}${url}`,
            ...(data && { data })
        };
        
        const start = Date.now();
        const response = await axios(config);
        const duration = Date.now() - start;
        
        log.success(`${name} - ${response.status} (${duration}ms)`);
        return { success: true, status: response.status, duration, data: response.data };
    } catch (error) {
        const duration = Date.now() - (error.config?._startTime || Date.now());
        log.error(`${name} - ${error.response?.status || 'ERROR'} (${duration}ms)`);
        
        // Mostrar más detalles del error
        if (error.response?.data) {
            console.log(`   ${colors.red}Detalles: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
        } else if (error.message) {
            console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
        }
        
        return { success: false, status: error.response?.status, error: error.message };
    }
}

async function runTests() {
    console.log(`\n${colors.blue}========================================`);
    console.log('🧪 Iniciando pruebas de API');
    console.log(`========================================${colors.reset}\n`);

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Test 1: Health Check
    const test1 = await testEndpoint('Health Check', 'GET', '/health');
    results.total++;
    test1.success ? results.passed++ : results.failed++;

    // Test 2: Database Connection
    const test2 = await testEndpoint('Database Connection', 'GET', '/api/test-connection');
    results.total++;
    test2.success ? results.passed++ : results.failed++;

    // Test 3: Get Tables
    const test3 = await testEndpoint('Get Tables', 'GET', '/api/tables');
    results.total++;
    test3.success ? results.passed++ : results.failed++;

    // Test 4: Get Producto Data
    const test4 = await testEndpoint('Get Producto Data', 'GET', '/api/data/Producto?limit=10');
    results.total++;
    test4.success ? results.passed++ : results.failed++;

    // Test 5: Get Categoria Data
    const test5 = await testEndpoint('Get Categoria Data', 'GET', '/api/data/Categoria');
    results.total++;
    test5.success ? results.passed++ : results.failed++;

    // Test 6: List Backups
    const test6 = await testEndpoint('List Backups', 'GET', '/api/backups/list');
    results.total++;
    test6.success ? results.passed++ : results.failed++;

    // Test 7: Get Backup Info
    const test7 = await testEndpoint('Get Backup Info', 'GET', '/api/backups/info');
    results.total++;
    test7.success ? results.passed++ : results.failed++;

    // Test 8: Invalid Table (should fail with 404)
    const test8 = await testEndpoint('Invalid Table', 'GET', '/api/data/TablaInexistente');
    results.total++;
    test8.status === 404 ? results.passed++ : results.failed++;

    // Test 9: Invalid Route (should fail with 404)
    const test9 = await testEndpoint('Invalid Route', 'GET', '/api/ruta-inexistente');
    results.total++;
    test9.status === 404 ? results.passed++ : results.failed++;

    // Resumen
    console.log(`\n${colors.blue}========================================`);
    console.log('📊 Resumen de Pruebas');
    console.log(`========================================${colors.reset}`);
    console.log(`Total:   ${results.total}`);
    log.success(`Exitosas: ${results.passed}`);
    if (results.failed > 0) {
        log.error(`Fallidas: ${results.failed}`);
    } else {
        console.log(`${colors.green}¡Todas las pruebas pasaron! 🎉${colors.reset}`);
    }
    console.log('');
}

// Ejecutar pruebas
runTests().catch(err => {
    log.error(`Error al ejecutar pruebas: ${err.message}`);
    process.exit(1);
});