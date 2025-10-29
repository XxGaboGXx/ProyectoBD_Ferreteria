const axios = require('axios');

const baseUrl = 'http://localhost:3000';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

async function testDashboard() {
    console.log(`\n${colors.magenta}========================================`);
    console.log('📊 PRUEBAS DE DASHBOARD Y REPORTES');
    console.log(`========================================${colors.reset}\n`);

    try {
        // 1. Dashboard Summary
        console.log(`${colors.cyan}📊 Dashboard Summary...${colors.reset}`);
        const summary = await axios.get(`${baseUrl}/api/dashboard/summary`);
        console.log(`${colors.green}✅ Datos obtenidos:${colors.reset}`);
        console.log(`   - Ventas hoy: ${summary.data.data.ventas.hoy.cantidad} (₡${(summary.data.data.ventas.hoy.total || 0).toFixed(2)})`);
        console.log(`   - Ventas mes: ${summary.data.data.ventas.mes.cantidad} (₡${(summary.data.data.ventas.mes.total || 0).toFixed(2)})`);
        console.log(`   - Total productos: ${summary.data.data.inventario.totalProductos}`);
        console.log(`   - Unidades totales: ${summary.data.data.inventario.unidadesTotal || 0}`);
        console.log(`   - Valor inventario: ₡${(summary.data.data.inventario.valorInventario || 0).toFixed(2)}`);
        console.log(`   - Stock bajo: ${summary.data.data.inventario.lowStock}`);
        console.log(`   - Total clientes: ${summary.data.data.clientes.total}`);
        console.log(`   - Nuevos hoy: ${summary.data.data.clientes.nuevosHoy}`);
        console.log(`   - Alquileres activos: ${summary.data.data.alquileres.total || 0}`);
        console.log(`   - Valor alquileres: ₡${(summary.data.data.alquileres.valorTotal || 0).toFixed(2)}`);

        // 2. Ventas por día
        console.log(`\n${colors.cyan}📈 Ventas por día (últimos 7 días)...${colors.reset}`);
        const ventasDia = await axios.get(`${baseUrl}/api/dashboard/ventas-por-dia?days=7`);
        console.log(`${colors.green}✅ ${ventasDia.data.data.length} días de datos${colors.reset}`);
        if (ventasDia.data.data.length > 0) {
            console.log(`   Primer día: ${ventasDia.data.data[0].Fecha} - ₡${ventasDia.data.data[0].TotalVentas.toFixed(2)}`);
        }

        // 3. Ventas por categoría
        console.log(`\n${colors.cyan}📊 Ventas por categoría...${colors.reset}`);
        const ventasCategoria = await axios.get(`${baseUrl}/api/dashboard/ventas-por-categoria`);
        console.log(`${colors.green}✅ ${ventasCategoria.data.data.length} categorías${colors.reset}`);

        // 4. Ventas por método de pago
        console.log(`\n${colors.cyan}💳 Ventas por método de pago...${colors.reset}`);
        const ventasMetodo = await axios.get(`${baseUrl}/api/dashboard/ventas-por-metodo-pago`);
        console.log(`${colors.green}✅ ${ventasMetodo.data.data.length} métodos de pago${colors.reset}`);

        // 5. Alertas
        console.log(`\n${colors.cyan}⚠️  Alertas del sistema...${colors.reset}`);
        const alertas = await axios.get(`${baseUrl}/api/dashboard/alertas`);
        console.log(`${colors.yellow}⚠️  Stock bajo: ${alertas.data.data.stockBajo.cantidad} productos${colors.reset}`);
        console.log(`${colors.yellow}⚠️  Alquileres vencidos: ${alertas.data.data.alquileresVencidos.cantidad}${colors.reset}`);
        console.log(`${colors.yellow}⚠️  Sin movimiento: ${alertas.data.data.sinMovimiento.cantidad} productos${colors.reset}`);

        // 6. Resumen Financiero
        console.log(`\n${colors.cyan}💰 Resumen financiero...${colors.reset}`);
        const financiero = await axios.get(`${baseUrl}/api/dashboard/resumen-financiero`);
        console.log(`${colors.green}✅ Ingresos hoy: ₡${(financiero.data.data.hoy.total || 0).toFixed(2)}${colors.reset}`);
        console.log(`   - Ventas: ${financiero.data.data.hoy.cantidad}`);
        console.log(`   - Semana: ₡${(financiero.data.data.semana.total || 0).toFixed(2)} (${financiero.data.data.semana.cantidad} ventas)`);
        console.log(`   - Mes ventas: ₡${(financiero.data.data.mes.ventas.total || 0).toFixed(2)}`);
        console.log(`   - Mes compras: ₡${(financiero.data.data.mes.compras.total || 0).toFixed(2)}`);
        console.log(`   - Utilidad bruta: ₡${(financiero.data.data.mes.utilidadBruta || 0).toFixed(2)}`);

        // 7. Top Clientes
        console.log(`\n${colors.cyan}🏆 Top 5 clientes...${colors.reset}`);
        const topClientes = await axios.get(`${baseUrl}/api/dashboard/top-clientes?limit=5`);
        console.log(`${colors.green}✅ ${topClientes.data.data.length} clientes${colors.reset}`);
        if (topClientes.data.data.length > 0) {
            topClientes.data.data.slice(0, 3).forEach((cliente, i) => {
                console.log(`   ${i + 1}. ${cliente.Nombre} - ₡${cliente.TotalGastado.toFixed(2)} (${cliente.CantidadCompras} compras)`);
            });
        }

        // 8. Rendimiento colaboradores
        console.log(`\n${colors.cyan}👷 Rendimiento de colaboradores...${colors.reset}`);
        const colaboradores = await axios.get(`${baseUrl}/api/dashboard/rendimiento-colaboradores`);
        console.log(`${colors.green}✅ ${colaboradores.data.data.length} colaboradores${colors.reset}`);

        // 9. Análisis de inventario
        console.log(`\n${colors.cyan}📦 Análisis de inventario...${colors.reset}`);
        const analisisInv = await axios.get(`${baseUrl}/api/dashboard/analisis-inventario`);
        console.log(`${colors.green}✅ Total productos: ${analisisInv.data.data.resumen.TotalProductos}${colors.reset}`);
        console.log(`   - Unidades totales: ${analisisInv.data.data.resumen.UnidadesTotales || 0}`);
        console.log(`   - Valor inventario: ₡${(analisisInv.data.data.resumen.ValorInventario || 0).toFixed(2)}`);
        console.log(`   - Stock bajo: ${analisisInv.data.data.resumen.ProductosStockBajo}`);
        console.log(`   - Agotados: ${analisisInv.data.data.resumen.ProductosAgotados}`);
        console.log(`   - Categorías: ${analisisInv.data.data.porCategoria.length}`);

        // 10. Movimientos recientes
        console.log(`\n${colors.cyan}📋 Movimientos recientes...${colors.reset}`);
        const movimientos = await axios.get(`${baseUrl}/api/dashboard/movimientos-recientes?limit=10`);
        console.log(`${colors.green}✅ ${movimientos.data.data.length} movimientos${colors.reset}`);

        // 11. Reporte de inventario
        console.log(`\n${colors.cyan}📦 Reporte de inventario...${colors.reset}`);
        const inventario = await axios.get(`${baseUrl}/api/reportes/inventario`);
        console.log(`${colors.green}✅ Total productos: ${inventario.data.data.resumen.TotalProductos}${colors.reset}`);
        console.log(`   - Valor inventario: ₡${(inventario.data.data.resumen.ValorTotalInventario || 0).toFixed(2)}`);
        console.log(`   - Stock bajo: ${inventario.data.data.resumen.ProductosStockBajo}`);
        console.log(`   - Agotados: ${inventario.data.data.resumen.ProductosAgotados}`);
        console.log(`   - Productos listados: ${inventario.data.data.productos.length}`);

        // 12. Reporte de clientes
        console.log(`\n${colors.cyan}👥 Reporte de clientes...${colors.reset}`);
        const clientes = await axios.get(`${baseUrl}/api/reportes/clientes`);
        console.log(`${colors.green}✅ Total clientes: ${clientes.data.data.totalClientes}${colors.reset}`);

        // 13. Reporte de ventas
        console.log(`\n${colors.cyan}💰 Reporte de ventas (mes actual)...${colors.reset}`);
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const fechaInicio = primerDia.toISOString().split('T')[0];
        const fechaFin = hoy.toISOString().split('T')[0];
        
        const reporteVentas = await axios.get(`${baseUrl}/api/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        console.log(`${colors.green}✅ Ventas encontradas: ${reporteVentas.data.data.ventas.length}${colors.reset}`);
        console.log(`   - Total ingresos: ₡${(reporteVentas.data.data.resumen.TotalIngresos || 0).toFixed(2)}`);
        console.log(`   - Promedio: ₡${(reporteVentas.data.data.resumen.PromedioVenta || 0).toFixed(2)}`);

        console.log(`\n${colors.green}========================================`);
        console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
        console.log(`========================================${colors.reset}\n`);

        console.log(`${colors.blue}📊 RESUMEN DE ENDPOINTS PROBADOS:${colors.reset}`);
        console.log('  ✅ Dashboard Summary');
        console.log('  ✅ Ventas por día');
        console.log('  ✅ Ventas por categoría');
        console.log('  ✅ Ventas por método de pago');
        console.log('  ✅ Alertas del sistema');
        console.log('  ✅ Resumen financiero');
        console.log('  ✅ Top clientes');
        console.log('  ✅ Rendimiento colaboradores');
        console.log('  ✅ Análisis inventario');
        console.log('  ✅ Movimientos recientes');
        console.log('  ✅ Reporte inventario');
        console.log('  ✅ Reporte clientes');
        console.log('  ✅ Reporte ventas\n');

    } catch (error) {
        console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Endpoint: ${error.config?.url}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        if (error.stack) {
            console.error(`\n${colors.red}Stack:${colors.reset}`, error.stack);
        }
        process.exit(1);
    }
}

testDashboard();