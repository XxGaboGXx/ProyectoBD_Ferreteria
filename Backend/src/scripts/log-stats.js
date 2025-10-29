const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');

console.log('📊 Estadísticas de Logs\n');

if (!fs.existsSync(logsDir)) {
    console.log('❌ No existe el directorio de logs');
    process.exit(1);
}

const files = fs.readdirSync(logsDir);
const logFiles = files.filter(f => f.endsWith('.log') && !f.startsWith('error-'));
const errorFiles = files.filter(f => f.startsWith('error-'));

let totalRequests = 0;
const methodStats = {};
const statusStats = {};
const urlStats = {};

logFiles.forEach(file => {
    const content = fs.readFileSync(path.join(logsDir, file), 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    lines.forEach(line => {
        try {
            const log = JSON.parse(line);
            totalRequests++;
            
            // Estadísticas por método
            methodStats[log.method] = (methodStats[log.method] || 0) + 1;
            
            // Estadísticas por status
            statusStats[log.status] = (statusStats[log.status] || 0) + 1;
            
            // Estadísticas por URL
            urlStats[log.url] = (urlStats[log.url] || 0) + 1;
        } catch (e) {
            // Ignorar líneas mal formateadas
        }
    });
});

console.log(`📈 Total de peticiones: ${totalRequests}\n`);

console.log('🔹 Por Método HTTP:');
Object.entries(methodStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
        const percentage = ((count / totalRequests) * 100).toFixed(1);
        console.log(`   ${method.padEnd(7)} → ${count.toString().padStart(5)} (${percentage}%)`);
    });

console.log('\n🔹 Por Código de Estado:');
Object.entries(statusStats)
    .sort((a, b) => a[0] - b[0])
    .forEach(([status, count]) => {
        const percentage = ((count / totalRequests) * 100).toFixed(1);
        let icon = '✅';
        if (status >= 500) icon = '❌';
        else if (status >= 400) icon = '⚠️';
        else if (status >= 300) icon = '🔄';
        console.log(`   ${icon} ${status} → ${count.toString().padStart(5)} (${percentage}%)`);
    });

console.log('\n🔹 URLs más accedidas:');
Object.entries(urlStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([url, count], index) => {
        const percentage = ((count / totalRequests) * 100).toFixed(1);
        console.log(`   ${(index + 1).toString().padStart(2)}. ${url.padEnd(40)} → ${count.toString().padStart(5)} (${percentage}%)`);
    });

if (errorFiles.length > 0) {
    console.log('\n❌ Archivos de error encontrados:');
    errorFiles.forEach(file => {
        const stats = fs.statSync(path.join(logsDir, file));
        console.log(`   - ${file} (${stats.size} bytes)`);
    });
}

console.log('\n📁 Archivos de log:', logFiles.length);
console.log('🗂️  Ubicación:', logsDir);