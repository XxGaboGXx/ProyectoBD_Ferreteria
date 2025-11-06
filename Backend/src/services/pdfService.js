const PDFDocument = require('pdfkit');

class PDFService {
    /**
     * Configuración general del PDF
     */
    configurarDocumento(doc, titulo, icono = '📊') {
        // Header con fondo azul
        doc.rect(0, 0, doc.page.width, 100).fill('#2563eb');
        
        // Título principal
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text(`${icono} ${titulo}`, 50, 30, { align: 'center' });

        // Fecha de generación
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#e0e7ff')
           .text(`Generado: ${new Date().toLocaleString('es-HN', { 
               dateStyle: 'long', 
               timeStyle: 'medium' 
           })}`, 50, 65, { align: 'center' });

        doc.fillColor('#000000'); // Restaurar color negro
        doc.y = 120; // Posición inicial del contenido
    }

    /**
     * Dibujar caja de resumen con estilo
     */
    dibujarResumen(doc, datos) {
        const startY = doc.y;
        
        // Fondo gris claro
        doc.rect(50, startY, 500, datos.length * 20 + 30)
           .fill('#f3f4f6');

        // Título "Resumen"
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1f2937')
           .text('📈 Resumen', 60, startY + 10);

        // Contenido
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#374151');

        let y = startY + 35;
        datos.forEach(item => {
            doc.text(`• ${item.label}: `, 70, y, { continued: true })
               .font('Helvetica-Bold')
               .text(item.value);
            doc.font('Helvetica');
            y += 18;
        });

        doc.fillColor('#000000');
        doc.y = y + 20;
    }

    /**
     * Dibujar tabla mejorada
     */
    dibujarTabla(doc, headers, rows, columnWidths = null) {
        const tableTop = doc.y;
        const numColumns = headers.length;
        const tableWidth = 500;
        
        // Calcular anchos automáticamente si no se proveen
        const widths = columnWidths || Array(numColumns).fill(tableWidth / numColumns);
        let y = tableTop;

        // Header de la tabla
        doc.rect(50, y, tableWidth, 25).fill('#2563eb');
        
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor('#ffffff');

        let x = 50;
        headers.forEach((header, i) => {
            doc.text(header, x + 5, y + 8, { 
                width: widths[i] - 10, 
                align: i === 0 ? 'left' : (i === numColumns - 1 ? 'right' : 'center')
            });
            x += widths[i];
        });

        y += 25;
        doc.fillColor('#000000');

        // Filas de datos
        doc.font('Helvetica').fontSize(8);
        
        rows.forEach((row, rowIndex) => {
            // Alternar colores de fondo
            const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
            doc.rect(50, y, tableWidth, 20).fill(bgColor);
            
            doc.fillColor('#374151');
            x = 50;
            
            row.forEach((cell, i) => {
                doc.text(cell, x + 5, y + 6, { 
                    width: widths[i] - 10, 
                    align: i === 0 ? 'left' : (i === numColumns - 1 ? 'right' : 'center')
                });
                x += widths[i];
            });

            y += 20;

            // Nueva página si es necesario
            if (y > 720) {
                doc.addPage();
                y = 50;
            }
        });

        // Línea final
        doc.moveTo(50, y).lineTo(550, y).stroke('#d1d5db');
        doc.y = y + 20;
    }

    /**
     * Generar PDF de Ventas
     */
    generarPDFVentas(data) {
        const doc = new PDFDocument({ margin: 50 });

        this.configurarDocumento(doc, 'Reporte de Ventas', '💰');

        // Período
        if (data.periodo) {
            doc.fontSize(11)
               .fillColor('#6b7280')
               .text(`📅 Período: ${new Date(data.periodo.inicio).toLocaleDateString('es-HN')} - ${new Date(data.periodo.fin).toLocaleDateString('es-HN')}`, { align: 'center' })
               .moveDown(2);
        }

        // Resumen
        if (data.resumen) {
            this.dibujarResumen(doc, [
                { label: 'Total Ventas', value: (data.resumen.TotalVentas || 0).toString() },
                { label: 'Total Ingresos', value: `L ${(data.resumen.TotalIngresos || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Promedio por Venta', value: `L ${(data.resumen.PromedioVenta || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Venta Máxima', value: `L ${(data.resumen.VentaMaxima || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` }
            ]);
        }

        // Tabla
        const headers = ['Fecha', 'ID', 'Cliente', 'Total', 'Estado'];
        const rows = (data.ventas || []).map(v => [
            new Date(v.Fecha).toLocaleDateString('es-HN'),
            v.Id_venta?.toString() || '',
            (v.NombreCliente || '').substring(0, 25),
            `L ${(v.TotalVenta || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
            v.Estado || ''
        ]);

        this.dibujarTabla(doc, headers, rows, [80, 40, 150, 120, 110]);

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .fillColor('#9ca3af')
               .text(`Página ${i + 1} de ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
        }

        return doc;
    }

    /**
     * Generar PDF de Compras
     */
    generarPDFCompras(data) {
        const doc = new PDFDocument({ margin: 50 });

        this.configurarDocumento(doc, 'Reporte de Compras', '🛒');

        if (data.periodo) {
            doc.fontSize(11)
               .fillColor('#6b7280')
               .text(`📅 Período: ${new Date(data.periodo.inicio).toLocaleDateString('es-HN')} - ${new Date(data.periodo.fin).toLocaleDateString('es-HN')}`, { align: 'center' })
               .moveDown(2);
        }

        if (data.resumen) {
            this.dibujarResumen(doc, [
                { label: 'Total Compras', value: (data.resumen.TotalCompras || 0).toString() },
                { label: 'Total Gastado', value: `L ${(data.resumen.TotalGastado || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Unidades Compradas', value: (data.resumen.UnidadesCompradas || 0).toLocaleString('es-HN') },
                { label: 'Promedio por Compra', value: `L ${(data.resumen.PromedioCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` }
            ]);
        }

        const headers = ['Fecha', 'ID', 'Proveedor', 'Total', 'Estado'];
        const rows = (data.compras || []).map(c => [
            new Date(c.Fecha).toLocaleDateString('es-HN'),
            c.Id_compra?.toString() || '',
            (c.NombreProveedor || '').substring(0, 25),
            `L ${(c.TotalCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
            c.Estado || ''
        ]);

        this.dibujarTabla(doc, headers, rows, [80, 40, 150, 120, 110]);

        return doc;
    }

    /**
     * Generar PDF de Alquileres
     */
    generarPDFAlquileres(data) {
        const doc = new PDFDocument({ margin: 50 });

        this.configurarDocumento(doc, 'Reporte de Alquileres', '🔧');

        if (data.periodo) {
            doc.fontSize(11)
               .fillColor('#6b7280')
               .text(`📅 Período: ${new Date(data.periodo.inicio).toLocaleDateString('es-HN')} - ${new Date(data.periodo.fin).toLocaleDateString('es-HN')}`, { align: 'center' })
               .moveDown(2);
        }

        if (data.resumen) {
            this.dibujarResumen(doc, [
                { label: 'Total Alquileres', value: (data.resumen.TotalAlquileres || 0).toString() },
                { label: 'Total Ingresos', value: `L ${(data.resumen.TotalIngresos || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Promedio por Alquiler', value: `L ${(data.resumen.PromedioAlquiler || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Activos', value: (data.resumen.Activos || 0).toString() },
                { label: 'Finalizados', value: (data.resumen.Finalizados || 0).toString() }
            ]);
        }

        const headers = ['ID', 'Cliente', 'Fecha Inicio', 'Total', 'Estado'];
        const rows = (data.alquileres || []).map(a => [
            a.Id_alquiler?.toString() || '',
            (a.NombreCliente || '').substring(0, 25),
            new Date(a.FechaInicio).toLocaleDateString('es-HN'),
            `L ${(a.TotalAlquiler || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
            a.Estado || ''
        ]);

        this.dibujarTabla(doc, headers, rows, [40, 150, 100, 120, 90]);

        return doc;
    }

    /**
     * Generar PDF de Inventario
     */
    generarPDFInventario(data) {
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

        this.configurarDocumento(doc, 'Reporte de Inventario', '📦');

        if (data.resumen) {
            this.dibujarResumen(doc, [
                { label: 'Total Productos', value: (data.resumen.TotalProductos || 0).toString() },
                { label: 'Valor Total', value: `L ${(data.resumen.ValorTotalInventario || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}` },
                { label: 'Stock Bajo', value: (data.resumen.ProductosStockBajo || 0).toString() },
                { label: 'Agotados', value: (data.resumen.ProductosAgotados || 0).toString() }
            ]);
        }

        const headers = ['Código', 'Producto', 'Categoría', 'Stock', 'Stock Mín', 'Estado', 'Valor'];
        const rows = (data.productos || []).map(p => [
            p.CodigoBarra || '',
            (p.Producto || '').substring(0, 30),
            p.Categoria || '',
            (p.Stock || 0).toString(),
            (p.StockMinimo || 0).toString(),
            p.EstadoStock || '',
            `L ${(p.ValorInventarioCosto || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
        ]);

        this.dibujarTabla(doc, headers, rows, [80, 200, 100, 60, 60, 100, 100]);

        return doc;
    }

    /**
     * Generar PDF de Top Productos
     */
    generarPDFTopProductos(productos, fechaInicio, fechaFin) {
        const doc = new PDFDocument({ margin: 50 });

        this.configurarDocumento(doc, 'Top 10 Productos Más Vendidos', '📊');

        doc.fontSize(11)
           .fillColor('#6b7280')
           .text(`📅 Período: ${new Date(fechaInicio).toLocaleDateString('es-HN')} - ${new Date(fechaFin).toLocaleDateString('es-HN')}`, { align: 'center' })
           .moveDown(2);

        const headers = ['#', 'Producto', 'Categoría', 'Cant. Vendida', 'Monto Total'];
        const rows = productos.map(p => [
            `🥇 ${p.Ranking}`,
            (p.Producto || '').substring(0, 25),
            p.Categoria || '',
            (p.CantidadVendida || 0).toLocaleString('es-HN'),
            `L ${(p.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
        ]);

        this.dibujarTabla(doc, headers, rows, [40, 180, 100, 90, 90]);

        return doc;
    }

    /**
     * Generar PDF de Top Clientes
     */
    generarPDFTopClientes(clientes, fechaInicio, fechaFin) {
        const doc = new PDFDocument({ margin: 50 });

        this.configurarDocumento(doc, 'Top 10 Clientes', '👥');

        doc.fontSize(11)
           .fillColor('#6b7280')
           .text(`📅 Período: ${new Date(fechaInicio).toLocaleDateString('es-HN')} - ${new Date(fechaFin).toLocaleDateString('es-HN')}`, { align: 'center' })
           .moveDown(2);

        const headers = ['#', 'Cliente', 'Compras', 'Monto Total', 'Promedio'];
        const rows = clientes.map(c => [
            `🏆 ${c.Ranking}`,
            (c.Cliente || '').substring(0, 30),
            (c.NumeroCompras || 0).toString(),
            `L ${(c.MontoTotal || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`,
            `L ${(c.PromedioCompra || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
        ]);

        this.dibujarTabla(doc, headers, rows, [40, 180, 70, 100, 110]);

        return doc;
    }
}

module.exports = new PDFService();