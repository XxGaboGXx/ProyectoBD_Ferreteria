# Data Mart de Compras - Ferretería Central
## Documentación Completa

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Data Mart](#arquitectura-del-data-mart)
3. [Modelo Dimensional](#modelo-dimensional)
4. [Proceso ETL](#proceso-etl)
5. [Vistas Analíticas](#vistas-analíticas)
6. [Guía de Uso](#guía-de-uso)
7. [Consultas de Ejemplo](#consultas-de-ejemplo)
8. [Mantenimiento](#mantenimiento)

---

## 🎯 Introducción

Este Data Mart está diseñado para analizar las compras de la Ferretería Central, implementando un modelo dimensional (estrella) que facilita consultas analíticas de alto rendimiento.

### Objetivos

- **Análisis de compras** por proveedor, producto y categoría
- **Seguimiento de tendencias** temporales
- **Análisis de rentabilidad** y márgenes
- **Gestión de inventario** basada en datos históricos
- **KPIs ejecutivos** para toma de decisiones

### Características

- ✅ Modelo de estrella optimizado
- ✅ SCD Tipo 2 para dimensiones que cambian
- ✅ ETL automatizado
- ✅ Vistas preconstruidas para análisis común
- ✅ Índices optimizados para consultas analíticas

---

## 🏗️ Arquitectura del Data Mart

### Esquema

El Data Mart utiliza el esquema `DM` (Data Mart) separado del esquema transaccional `dbo`.

### Componentes

```
┌─────────────────────────────────────┐
│        OLTP (dbo)                   │
│  - Compra                           │
│  - DetalleCompra                    │
│  - Producto                         │
│  - Proveedor                        │
│  - Categoria                        │
└──────────────┬──────────────────────┘
               │
               │ ETL Process
               ↓
┌─────────────────────────────────────┐
│     Data Mart (DM)                  │
│                                     │
│  Dimensiones:                       │
│  - Dim_Tiempo                       │
│  - Dim_Proveedor (SCD Tipo 2)      │
│  - Dim_Categoria (SCD Tipo 2)      │
│  - Dim_Producto (SCD Tipo 2)       │
│                                     │
│  Hechos:                            │
│  - Fact_Compras                     │
└─────────────────────────────────────┘
```

---

## 📊 Modelo Dimensional

### Esquema Estrella

```
                  Dim_Tiempo
                      │
                      │
    Dim_Proveedor ────┼──── Fact_Compras ──── Dim_Producto
                      │                            │
                      │                            │
                 Dim_Categoria ───────────────────┘
```

### Dimensiones

#### 1. **Dim_Tiempo**
Granularidad: Día

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id_tiempo | INT | PK, Identidad |
| Fecha | DATE | Fecha única |
| Anio | INT | Año (2024, 2025...) |
| Trimestre | INT | Trimestre (1-4) |
| Mes | INT | Mes (1-12) |
| NombreMes | VARCHAR(20) | Nombre del mes |
| Dia | INT | Día del mes (1-31) |
| DiaSemana | INT | Día de la semana (1-7) |
| NombreDia | VARCHAR(20) | Nombre del día |
| Semana | INT | Número de semana del año |
| EsFinDeSemana | BIT | Indica si es fin de semana |
| EsFeriado | BIT | Indica si es feriado |
| NombreFeriado | VARCHAR(100) | Nombre del feriado |

#### 2. **Dim_Proveedor** (SCD Tipo 2)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id_dim_proveedor | INT | PK, Identidad (clave subrogada) |
| Id_proveedor | INT | Clave de negocio |
| Nombre | VARCHAR(20) | Nombre del proveedor |
| Telefono | VARCHAR(20) | Teléfono |
| Direccion | VARCHAR(255) | Dirección |
| Correo_electronico | VARCHAR(100) | Email |
| FechaInicio | DATETIME | Inicio de vigencia |
| FechaFin | DATETIME | Fin de vigencia |
| EsActual | BIT | Registro actual (1) o histórico (0) |

#### 3. **Dim_Categoria** (SCD Tipo 2)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id_dim_categoria | INT | PK, Identidad |
| Id_categoria | INT | Clave de negocio |
| Nombre | VARCHAR(50) | Nombre de la categoría |
| Descripcion | VARCHAR(100) | Descripción |
| FechaInicio | DATETIME | Inicio de vigencia |
| FechaFin | DATETIME | Fin de vigencia |
| EsActual | BIT | Registro actual |

#### 4. **Dim_Producto** (SCD Tipo 2)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id_dim_producto | INT | PK, Identidad |
| Id_producto | INT | Clave de negocio |
| Nombre | VARCHAR(20) | Nombre del producto |
| Descripcion | VARCHAR(100) | Descripción |
| CodigoBarra | VARCHAR(50) | Código de barras |
| PrecioCompra | DECIMAL(12,2) | Precio de compra actual |
| PrecioVenta | DECIMAL(12,2) | Precio de venta actual |
| Id_dim_categoria | INT | FK a Dim_Categoria |
| CantidadActual | INT | Stock actual |
| CantidadMinima | INT | Stock mínimo |
| FechaInicio | DATETIME | Inicio de vigencia |
| FechaFin | DATETIME | Fin de vigencia |
| EsActual | BIT | Registro actual |

### Tabla de Hechos

#### **Fact_Compras**
Granularidad: Detalle de compra (línea de factura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id_fact_compra | BIGINT | PK, Identidad |
| Id_dim_tiempo | INT | FK a Dim_Tiempo |
| Id_dim_proveedor | INT | FK a Dim_Proveedor |
| Id_dim_producto | INT | FK a Dim_Producto |
| Id_dim_categoria | INT | FK a Dim_Categoria |
| Id_compra | INT | Clave de negocio (trazabilidad) |
| NumeroFactura | VARCHAR(50) | Número de factura |
| CantidadComprada | INT | Unidades compradas (métrica aditiva) |
| PrecioUnitario | DECIMAL(12,2) | Precio unitario |
| Subtotal | DECIMAL(12,2) | Subtotal línea (métrica aditiva) |
| TotalCompra | DECIMAL(12,2) | Total de la compra (métrica semi-aditiva) |
| FechaCarga | DATETIME | Fecha de carga en el DM |

**Métricas:**
- **Aditivas**: Se pueden sumar en todas las dimensiones (CantidadComprada, Subtotal)
- **Semi-aditivas**: Solo se pueden sumar en algunas dimensiones (TotalCompra)

---

## 🔄 Proceso ETL

### Flujo de Carga

```
1. Cargar Dim_Tiempo
   ↓
2. Cargar Dim_Proveedor (SCD Tipo 2)
   ↓
3. Cargar Dim_Categoria (SCD Tipo 2)
   ↓
4. Cargar Dim_Producto (SCD Tipo 2)
   ↓
5. Cargar Fact_Compras
```

### Procedimientos Almacenados

#### 1. **sp_Cargar_Dim_Tiempo**
```sql
EXEC DM.sp_Cargar_Dim_Tiempo 
    @FechaInicio = '2024-01-01',
    @FechaFin = '2025-12-31';
```
Puebla la dimensión tiempo para el rango especificado.

#### 2. **sp_Cargar_Dim_Proveedor**
```sql
EXEC DM.sp_Cargar_Dim_Proveedor;
```
Implementa SCD Tipo 2 para proveedores:
- Detecta cambios en: Nombre, Teléfono, Dirección, Email
- Cierra registro antiguo (EsActual=0, FechaFin=GETDATE())
- Crea nuevo registro (EsActual=1, FechaInicio=GETDATE())

#### 3. **sp_Cargar_Dim_Categoria**
```sql
EXEC DM.sp_Cargar_Dim_Categoria;
```
Implementa SCD Tipo 2 para categorías.

#### 4. **sp_Cargar_Dim_Producto**
```sql
EXEC DM.sp_Cargar_Dim_Producto;
```
Implementa SCD Tipo 2 para productos. Detecta cambios en:
- Nombre, Descripción
- PrecioCompra, PrecioVenta
- CantidadMinima

#### 5. **sp_Cargar_Fact_Compras**
```sql
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = '2024-01-01',
    @FechaFin = '2024-12-31';
```
Carga los hechos de compras para el período especificado.

#### 6. **sp_ETL_DataMart_Completo** (Maestro)
```sql
EXEC DM.sp_ETL_DataMart_Completo 
    @FechaInicio = '2024-01-01',
    @FechaFin = NULL; -- NULL = hasta hoy
```
Ejecuta el proceso ETL completo en orden.

### Programación de Carga

**Carga Inicial:**
```sql
-- Primera vez: cargar todo el histórico
EXEC DM.sp_ETL_DataMart_Completo 
    @FechaInicio = NULL, -- Desde la primera compra
    @FechaFin = NULL;    -- Hasta hoy
```

**Carga Incremental Diaria:**
```sql
-- SQL Server Agent Job (diario a las 23:00)
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = CAST(GETDATE() AS DATE),
    @FechaFin = CAST(GETDATE() AS DATE);
```

**Actualización de Dimensiones:**
```sql
-- SQL Server Agent Job (semanal, domingos 01:00)
EXEC DM.sp_Cargar_Dim_Proveedor;
EXEC DM.sp_Cargar_Dim_Categoria;
EXEC DM.sp_Cargar_Dim_Producto;
```

---

## 📈 Vistas Analíticas

### Vistas Disponibles

#### 1. **vw_Compras_Por_Mes**
Resumen mensual de compras.
```sql
SELECT * FROM DM.vw_Compras_Por_Mes
ORDER BY Anio DESC, Mes DESC;
```

#### 2. **vw_Top_Proveedores**
Ranking de proveedores por volumen de compras.
```sql
SELECT TOP 10 * FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
```

#### 3. **vw_Productos_Mas_Comprados**
Productos ordenados por unidades compradas.
```sql
SELECT TOP 20 * FROM DM.vw_Productos_Mas_Comprados
ORDER BY TotalUnidadesCompradas DESC;
```

#### 4. **vw_Analisis_Por_Categoria**
Análisis agregado por categoría.
```sql
SELECT * FROM DM.vw_Analisis_Por_Categoria
ORDER BY MontoTotal DESC;
```

#### 5. **vw_Tendencias_Trimestrales**
Tendencias por trimestre.
```sql
SELECT * FROM DM.vw_Tendencias_Trimestrales
ORDER BY Anio DESC, Trimestre DESC;
```

#### 6. **vw_Rentabilidad_Productos**
Análisis de márgenes y rentabilidad.
```sql
SELECT * FROM DM.vw_Rentabilidad_Productos
WHERE PorcentajeMargen > 20
ORDER BY MargenUnitario DESC;
```

#### 7. **vw_Alertas_Inventario**
Productos con stock crítico.
```sql
SELECT * FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta LIKE 'CRÍTICO%'
ORDER BY DiasDesdeUltimaCompra DESC;
```

### Función de Tabla

#### **fn_Compras_Periodo**
```sql
-- Compras del último trimestre
SELECT * FROM DM.fn_Compras_Periodo(
    DATEADD(QUARTER, -1, GETDATE()),
    GETDATE()
);
```

---

## 🚀 Guía de Uso

### Instalación Inicial

#### Paso 1: Ejecutar el Script Principal
```sql
-- En SQL Server Management Studio
USE [FerreteriaCentral];
GO

-- Ejecutar DataMart_Compras.sql completo
-- Esto crea:
-- - Esquema DM
-- - Todas las tablas de dimensiones
-- - Tabla de hechos
-- - Procedimientos almacenados
-- - Vistas analíticas
```

#### Paso 2: Cargar Datos Iniciales
```sql
-- Cargar todo el histórico
EXEC DM.sp_ETL_DataMart_Completo;
```

#### Paso 3: Verificar la Carga
```sql
-- Ver estadísticas
EXEC DM.sp_Estadisticas_DataMart;

-- Verificar integridad
-- (Ver consulta #19 en DataMart_Consultas_Ejemplo.sql)
```

### Uso Cotidiano

#### Consultas Rápidas para Dashboards

**KPIs Principales:**
```sql
-- Ver consulta #17 en DataMart_Consultas_Ejemplo.sql
```

**Top 10 Proveedores:**
```sql
SELECT TOP 10
    Proveedor,
    FORMAT(MontoTotal, 'C', 'es-CR') AS Monto,
    TotalCompras,
    UltimaCompra
FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
```

**Productos Críticos:**
```sql
SELECT * FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta IN ('CRÍTICO - Sin Stock', 'URGENTE - Por debajo del mínimo');
```

#### Análisis Ad-Hoc

**Compras del mes actual:**
```sql
DECLARE @InicioMes DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
DECLARE @FinMes DATE = EOMONTH(GETDATE());

SELECT * FROM DM.fn_Compras_Periodo(@InicioMes, @FinMes);
```

**Comparativa año actual vs anterior:**
```sql
-- Ver consulta #7 en DataMart_Consultas_Ejemplo.sql
```

---

## 🛠️ Mantenimiento

### Tareas de Mantenimiento

#### 1. Actualizar Estadísticas
```sql
-- Mensualmente
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;
UPDATE STATISTICS DM.Dim_Producto WITH FULLSCAN;
UPDATE STATISTICS DM.Dim_Proveedor WITH FULLSCAN;
```

#### 2. Reconstruir Índices
```sql
-- Mensualmente (o cuando la fragmentación > 30%)
ALTER INDEX ALL ON DM.Fact_Compras REBUILD;
ALTER INDEX ALL ON DM.Dim_Producto REBUILD;
```

#### 3. Limpiar Datos Antiguos
```sql
-- Anualmente, mantener solo 3 años de histórico
EXEC DM.sp_Limpiar_Datos_Antiguos @AñosAConservar = 3;
```

#### 4. Verificar Integridad
```sql
-- Semanalmente
DBCC CHECKDB('FerreteriaCentral');

-- Verificar consistencia de datos
-- Ver consulta #19 en DataMart_Consultas_Ejemplo.sql
```

### Monitoreo

#### Tamaño de las Tablas
```sql
SELECT 
    t.NAME AS TableName,
    p.rows AS RowCounts,
    SUM(a.total_pages) * 8 / 1024 AS TotalSpaceMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.schema_id = SCHEMA_ID('DM')
GROUP BY t.Name, p.Rows
ORDER BY TotalSpaceMB DESC;
```

#### Rendimiento de Consultas
```sql
-- Consultas más costosas en el Data Mart
SELECT TOP 10
    qs.execution_count,
    qs.total_worker_time / 1000000 AS TotalCPU_Seg,
    qs.total_elapsed_time / 1000000 AS TotalTiempo_Seg,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2)+1) AS Query
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%DM.%'
ORDER BY qs.total_worker_time DESC;
```

### Backup del Data Mart

```sql
-- Backup completo semanal
BACKUP DATABASE [FerreteriaCentral]
TO DISK = 'C:\Backups\FerreteriaCentral_DM_Full.bak'
WITH FORMAT, COMPRESSION, STATS = 10;

-- Backup diferencial diario
BACKUP DATABASE [FerreteriaCentral]
TO DISK = 'C:\Backups\FerreteriaCentral_DM_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION, STATS = 10;
```

---

## 📊 Casos de Uso

### Caso 1: Análisis de Rentabilidad

**Objetivo:** Identificar productos con mejor margen de ganancia.

```sql
SELECT TOP 10
    Producto,
    Categoria,
    FORMAT(MargenUnitario, 'C') AS Margen,
    CAST(PorcentajeMargen AS DECIMAL(10,2)) AS MargenPct,
    InventarioActual,
    FORMAT(ValorPotencialVenta - ValorInventario, 'C') AS UtilidadPotencial
FROM DM.vw_Rentabilidad_Productos
WHERE InventarioActual > 0
ORDER BY PorcentajeMargen DESC;
```

### Caso 2: Planificación de Compras

**Objetivo:** Determinar qué productos ordenar basándose en histórico.

```sql
SELECT 
    Producto,
    Categoria,
    StockActual,
    StockMinimo,
    DeficitUnidades,
    CAST(PromedioCompra AS INT) AS SugerenciaOrden,
    UltimaCompra,
    ProveedoresDisponibles
FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta != 'NORMAL'
ORDER BY DeficitUnidades DESC;
```

### Caso 3: Evaluación de Proveedores

**Objetivo:** Seleccionar mejores proveedores para renovar contratos.

```sql
SELECT 
    Proveedor,
    ProductosDiferentes AS VariedadProductos,
    FORMAT(MontoTotal, 'C') AS VolumenCompras,
    FORMAT(PromedioCompra, 'C') AS TicketPromedio,
    UltimaCompra,
    DATEDIFF(DAY, UltimaCompra, GETDATE()) AS DiasInactividad
FROM DM.vw_Top_Proveedores
WHERE MontoTotal > 100000
ORDER BY MontoTotal DESC, DiasInactividad ASC;
```

---

## 🔐 Seguridad y Permisos

### Roles Recomendados

```sql
-- Crear rol de solo lectura para analistas
CREATE ROLE DataMart_Reader;
GRANT SELECT ON SCHEMA::DM TO DataMart_Reader;

-- Crear rol para ETL
CREATE ROLE DataMart_ETL;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::DM TO DataMart_ETL;
GRANT EXECUTE ON SCHEMA::DM TO DataMart_ETL;

-- Asignar usuarios
ALTER ROLE DataMart_Reader ADD MEMBER [Analista1];
ALTER ROLE DataMart_ETL ADD MEMBER [ServicioETL];
```

---

## 📞 Soporte y Contacto

Para preguntas o soporte adicional sobre el Data Mart:

- **Documentación adicional:** Ver `DataMart_Consultas_Ejemplo.sql`
- **Repositorio:** [Proyecto-DB-main]
- **Fecha de creación:** 2025-11-05

---

## 📝 Notas Finales

### Mejores Prácticas

1. **Ejecutar ETL en horarios de baja actividad** (después de las 22:00)
2. **Mantener backups** antes de ejecutar cargas masivas
3. **Monitorear el crecimiento** del Fact_Compras (es la tabla más grande)
4. **Revisar planes de ejecución** de consultas lentas
5. **Actualizar estadísticas** después de cargas grandes

### Extensiones Futuras

- [ ] Agregar dimensión de colaboradores
- [ ] Integrar con ventas para análisis cruzado
- [ ] Implementar cubos OLAP (Analysis Services)
- [ ] Dashboard en Power BI conectado al Data Mart
- [ ] Alertas automáticas por email para stock crítico

---

**Versión:** 1.0  
**Última actualización:** 2025-11-05
