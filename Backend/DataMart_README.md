# 🏪 Data Mart de Compras - Ferretería Central

## 📦 Descripción

Sistema de Data Mart dimensional (modelo estrella) para análisis de compras, proveedores, productos e inventario de la Ferretería Central.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- SQL Server 2016 o superior
- Base de datos `FerreteriaCentral` ya creada
- Datos de compras en las tablas: `Compra`, `DetalleCompra`, `Producto`, `Proveedor`, `Categoria`

### Instalación en 3 Pasos

#### 1️⃣ Crear el Data Mart
```sql
-- Ejecutar en SQL Server Management Studio
USE [FerreteriaCentral];
GO

-- Ejecutar el archivo completo:
-- DataMart_Compras.sql
```

#### 2️⃣ Inicializar y Cargar Datos
```sql
-- Ejecutar el archivo de inicialización:
-- DataMart_Inicializacion.sql
```

#### 3️⃣ ¡Listo! Empezar a Consultar
```sql
-- Ver top proveedores
SELECT TOP 10 * FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;

-- Ver productos críticos
SELECT * FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta LIKE 'CRÍTICO%';
```

---

## 📁 Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `DataMart_Compras.sql` | Script principal - Crea todo el Data Mart |
| `DataMart_Inicializacion.sql` | Carga inicial de datos |
| `DataMart_Consultas_Ejemplo.sql` | 20+ consultas de ejemplo listas para usar |
| `DataMart_Documentacion.md` | Documentación completa y detallada |
| `DataMart_README.md` | Este archivo |

---

## 🗂️ Estructura del Data Mart

### Esquema Estrella

```
        Dim_Tiempo
             │
             │
Dim_Proveedor ──┼── Fact_Compras ──── Dim_Producto
             │                             │
             │                             │
        Dim_Categoria ────────────────────┘
```

### Tablas Principales

**Dimensiones:**
- `DM.Dim_Tiempo` - Calendario con atributos temporales
- `DM.Dim_Proveedor` - Proveedores (SCD Tipo 2)
- `DM.Dim_Categoria` - Categorías de productos (SCD Tipo 2)
- `DM.Dim_Producto` - Productos (SCD Tipo 2)

**Hechos:**
- `DM.Fact_Compras` - Detalle de todas las compras

---

## 📊 Vistas Analíticas Disponibles

### Vista General

```sql
-- 1. Resumen mensual de compras
SELECT * FROM DM.vw_Compras_Por_Mes;

-- 2. Ranking de proveedores
SELECT * FROM DM.vw_Top_Proveedores;

-- 3. Productos más comprados
SELECT * FROM DM.vw_Productos_Mas_Comprados;

-- 4. Análisis por categoría
SELECT * FROM DM.vw_Analisis_Por_Categoria;

-- 5. Tendencias trimestrales
SELECT * FROM DM.vw_Tendencias_Trimestrales;

-- 6. Análisis de rentabilidad
SELECT * FROM DM.vw_Rentabilidad_Productos;

-- 7. Alertas de inventario
SELECT * FROM DM.vw_Alertas_Inventario;
```

---

## 🔄 Mantenimiento

### Carga Incremental Diaria

```sql
-- Cargar compras de hoy
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = CAST(GETDATE() AS DATE),
    @FechaFin = CAST(GETDATE() AS DATE);
```

### Actualización de Dimensiones

```sql
-- Ejecutar semanalmente
EXEC DM.sp_Cargar_Dim_Proveedor;
EXEC DM.sp_Cargar_Dim_Categoria;
EXEC DM.sp_Cargar_Dim_Producto;
```

### Recarga Completa

```sql
-- Si necesitas recargar todo
EXEC DM.sp_ETL_DataMart_Completo;
```

---

## 📈 Casos de Uso Comunes

### 1. Dashboard Ejecutivo

```sql
-- KPIs principales
SELECT 
    'Total Compras' AS Indicador,
    COUNT(DISTINCT Id_compra) AS Valor
FROM DM.Fact_Compras

UNION ALL

SELECT 
    'Inversión Total',
    FORMAT(SUM(TotalCompra), 'C', 'es-CR')
FROM DM.Fact_Compras;
```

### 2. Análisis de Rentabilidad

```sql
-- Top productos rentables
SELECT TOP 10
    Producto,
    FORMAT(MargenUnitario, 'C') AS Margen,
    PorcentajeMargen
FROM DM.vw_Rentabilidad_Productos
WHERE InventarioActual > 0
ORDER BY PorcentajeMargen DESC;
```

### 3. Planificación de Compras

```sql
-- Qué ordenar
SELECT 
    Producto,
    StockActual,
    StockMinimo,
    DeficitUnidades,
    NivelAlerta
FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta != 'NORMAL'
ORDER BY DeficitUnidades DESC;
```

### 4. Evaluación de Proveedores

```sql
-- Mejores proveedores
SELECT TOP 10
    Proveedor,
    TotalCompras,
    FORMAT(MontoTotal, 'C') AS Volumen,
    UltimaCompra
FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
```

---

## 🎯 Consultas Frecuentes (FAQ)

### ¿Con qué frecuencia debo actualizar el Data Mart?

**Recomendado:**
- **Fact_Compras:** Diariamente (después del cierre del día)
- **Dimensiones:** Semanalmente (domingos)

### ¿Cuánto espacio ocupará el Data Mart?

Aproximadamente:
- **Dimensiones:** ~10-50 MB
- **Fact_Compras:** ~500 bytes por línea de compra
- **Total:** Variable según histórico (usualmente 100-500 MB por año)

### ¿Qué es SCD Tipo 2?

**Slowly Changing Dimension Tipo 2** mantiene el historial de cambios:
- Cuando un proveedor cambia de dirección, se crea un nuevo registro
- El registro antiguo se marca como histórico (`EsActual = 0`)
- Permite analizar datos con la información que existía en ese momento

### ¿Puedo conectar Power BI a este Data Mart?

**¡Sí!** El Data Mart está optimizado para herramientas de BI:

1. En Power BI Desktop: `Obtener datos` → `SQL Server`
2. Seleccionar las vistas del esquema `DM`
3. Crear relaciones automáticas (ya están en el modelo)
4. ¡Crear dashboards!

---

## 📞 Troubleshooting

### Error: "El esquema DM no existe"

**Solución:** Ejecutar primero `DataMart_Compras.sql`

### Error: "No hay compras para cargar"

**Solución:** Verificar que existan datos en la tabla `dbo.Compra`

### Las consultas son lentas

**Solución:**
```sql
-- Actualizar estadísticas
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;

-- Reconstruir índices
ALTER INDEX ALL ON DM.Fact_Compras REBUILD;
```

### Los totales no coinciden con OLTP

**Solución:**
```sql
-- Verificar integridad (consulta #19 en DataMart_Consultas_Ejemplo.sql)
-- Recargar si es necesario
EXEC DM.sp_ETL_DataMart_Completo;
```

---

## 🛠️ Automatización con SQL Server Agent

### Job 1: Carga Diaria de Hechos

```sql
-- Programar para 23:00 todos los días
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = CAST(GETDATE() AS DATE),
    @FechaFin = CAST(GETDATE() AS DATE);
```

### Job 2: Actualización Semanal de Dimensiones

```sql
-- Programar para domingos 01:00
EXEC DM.sp_Cargar_Dim_Proveedor;
EXEC DM.sp_Cargar_Dim_Categoria;
EXEC DM.sp_Cargar_Dim_Producto;
```

### Job 3: Mantenimiento Mensual

```sql
-- Primer domingo del mes 02:00
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;
ALTER INDEX ALL ON DM.Fact_Compras REBUILD;
```

---

## 📚 Recursos Adicionales

- **Documentación completa:** `DataMart_Documentacion.md`
- **Consultas de ejemplo:** `DataMart_Consultas_Ejemplo.sql`
- **Diagrama ER:** Ver imagen adjunta del modelo

---

## 🤝 Contribuir

¿Encontraste un bug o tienes una mejora?

1. Documenta el problema/mejora
2. Crea un branch nuevo
3. Implementa la solución
4. Solicita un pull request

---

## 📝 Licencia

Este proyecto es parte del sistema de gestión de Ferretería Central.

---

## ✨ Características Destacadas

✅ **Modelo dimensional optimizado** para análisis rápidos  
✅ **SCD Tipo 2** para mantener historial de cambios  
✅ **Vistas preconstruidas** para consultas comunes  
✅ **ETL automatizado** con procedimientos almacenados  
✅ **Documentación completa** con ejemplos  
✅ **Listo para Power BI** y otras herramientas de BI  
✅ **Alertas de inventario** integradas  
✅ **Análisis de rentabilidad** por producto  

---

## 🎓 Conceptos Aprendidos

Este proyecto implementa:

- **Data Warehousing:** Separación OLTP vs OLAP
- **Modelado dimensional:** Esquema estrella
- **ETL:** Extract, Transform, Load
- **SCD:** Slowly Changing Dimensions
- **Optimización:** Índices y particiones
- **BI:** Vistas analíticas y KPIs

---

**Versión:** 1.0  
**Fecha:** 2025-11-05  
**Autor:** Proyecto DB - Ferretería Central

---

## 🚦 Estado del Proyecto

🟢 **Producción** - Listo para usar

---

¡Feliz análisis! 📊🎉
