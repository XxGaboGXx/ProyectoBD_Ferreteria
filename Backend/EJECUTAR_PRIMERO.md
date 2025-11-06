# 🚀 GUÍA DE EJECUCIÓN RÁPIDA
## Data Mart de Compras - Ferretería Central

---

## ⚡ Ejecución en 5 Minutos

### Paso 1: Ejecutar Script Principal (2 min)
```sql
-- Abrir en SQL Server Management Studio
-- Archivo: DataMart_Compras.sql
-- Ejecutar completo (F5)
```

**Esto crea:**
- ✅ Esquema `DM`
- ✅ 4 Tablas de Dimensiones
- ✅ 1 Tabla de Hechos
- ✅ 7 Vistas Analíticas
- ✅ 6 Procedimientos ETL

### Paso 2: Inicializar Datos (2 min)
```sql
-- Archivo: DataMart_Inicializacion.sql
-- Ejecutar completo (F5)
```

**Esto carga:**
- ✅ Dimensión Tiempo (varios años)
- ✅ Todas las dimensiones de negocio
- ✅ Tabla de hechos completa
- ✅ Ejecuta verificaciones

### Paso 3: Ejecutar Pruebas (1 min)
```sql
-- Archivo: DataMart_Pruebas.sql
-- Ejecutar completo (F5)
```

**Verifica:**
- ✅ 15 pruebas automatizadas
- ✅ Integridad de datos
- ✅ Rendimiento
- ✅ Consistencia

---

## 📝 Orden de Ejecución Detallado

### 1️⃣ Creación del Data Mart
```
Archivo: DataMart_Compras.sql
Duración: ~2 minutos
Estado: OBLIGATORIO
```

**Ejecutar completo sin modificar nada.**

### 2️⃣ Carga Inicial
```
Archivo: DataMart_Inicializacion.sql
Duración: ~2-5 minutos (depende del volumen)
Estado: OBLIGATORIO
```

**Limpia y carga todos los datos históricos.**

### 3️⃣ Pruebas
```
Archivo: DataMart_Pruebas.sql
Duración: ~30 segundos
Estado: RECOMENDADO
```

**Valida que todo funcione correctamente.**

### 4️⃣ Visualización (Opcional)
```
Archivo: DataMart_Visualizacion.sql
Duración: ~10 segundos
Estado: OPCIONAL
```

**Muestra estructura y diagramas.**

### 5️⃣ Consultas de Ejemplo (Opcional)
```
Archivo: DataMart_Consultas_Ejemplo.sql
Duración: Variable
Estado: OPCIONAL
```

**20+ consultas listas para explorar los datos.**

---

## 🔄 Flujo de Trabajo Completo

```
┌─────────────────────────────────────┐
│  1. DataMart_Compras.sql            │
│     Crear estructura completa       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  2. DataMart_Inicializacion.sql     │
│     Cargar datos iniciales          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  3. DataMart_Pruebas.sql            │
│     Verificar funcionamiento        │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  ✓ Data Mart Listo                  │
│     Usar vistas y consultas         │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Instalación

### Antes de Empezar
- [ ] SQL Server instalado (2016+)
- [ ] Base de datos `FerreteriaCentral` existe
- [ ] Tablas OLTP creadas (Compra, DetalleCompra, Producto, etc.)
- [ ] Hay datos en las tablas OLTP
- [ ] Permisos de administrador en la BD

### Durante la Instalación
- [ ] Ejecutado `DataMart_Compras.sql` sin errores
- [ ] Ejecutado `DataMart_Inicializacion.sql` sin errores
- [ ] Verificado que se cargaron datos (ver output)
- [ ] Ejecutadas pruebas (`DataMart_Pruebas.sql`)
- [ ] Todas las pruebas en verde ✓

### Después de la Instalación
- [ ] Probada al menos 1 vista analítica
- [ ] Verificado que las consultas retornan datos
- [ ] Revisada la documentación completa
- [ ] Programado ETL incremental (opcional)

---

## 🎯 Comandos Esenciales

### Verificar que Todo Está Bien
```sql
-- Ver estadísticas
EXEC DM.sp_Estadisticas_DataMart;

-- Ver top proveedores
SELECT TOP 5 * FROM DM.vw_Top_Proveedores;

-- Ver productos críticos
SELECT * FROM DM.vw_Alertas_Inventario;
```

### Actualizar Datos (Diario)
```sql
-- Cargar compras de hoy
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = CAST(GETDATE() AS DATE),
    @FechaFin = CAST(GETDATE() AS DATE);
```

### Recargar Todo (Si hay problemas)
```sql
-- Limpio y recargo todo
EXEC DM.sp_ETL_DataMart_Completo;
```

---

## 🚨 Solución de Problemas Comunes

### Error: "El esquema DM no existe"
**Causa:** No se ejecutó `DataMart_Compras.sql`
**Solución:** Ejecutar `DataMart_Compras.sql` primero

### Error: "No hay compras para cargar"
**Causa:** Las tablas OLTP están vacías
**Solución:** Insertar datos de prueba en `Compra` y `DetalleCompra`

### Advertencia: "Diferencia en los datos"
**Causa:** Puede haber compras fuera del rango de fechas
**Solución:** Normal si hay datos muy antiguos o muy nuevos

### Error: "Timeout en consulta"
**Causa:** Muchos datos y estadísticas desactualizadas
**Solución:**
```sql
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;
ALTER INDEX ALL ON DM.Fact_Compras REBUILD;
```

### Las vistas no retornan datos
**Causa:** No se ejecutó la inicialización
**Solución:** Ejecutar `DataMart_Inicializacion.sql`

---

## 📊 Primeras Consultas Recomendadas

### 1. Ver Resumen General
```sql
EXEC DM.sp_Estadisticas_DataMart;
```

### 2. Top 10 Proveedores
```sql
SELECT TOP 10 
    Proveedor,
    TotalCompras,
    FORMAT(MontoTotal, 'C', 'es-CR') AS Monto
FROM DM.vw_Top_Proveedores
ORDER BY MontoTotal DESC;
```

### 3. Productos Más Vendidos
```sql
SELECT TOP 10 
    Producto,
    Categoria,
    TotalUnidadesCompradas
FROM DM.vw_Productos_Mas_Comprados
ORDER BY TotalUnidadesCompradas DESC;
```

### 4. Productos con Inventario Crítico
```sql
SELECT 
    Producto,
    StockActual,
    StockMinimo,
    NivelAlerta
FROM DM.vw_Alertas_Inventario
WHERE NivelAlerta LIKE '%CRÍTICO%' OR NivelAlerta LIKE '%URGENTE%';
```

### 5. Tendencias Mensuales
```sql
SELECT TOP 6
    NombreMes + ' ' + CAST(Anio AS VARCHAR) AS Periodo,
    TotalCompras,
    FORMAT(MontoTotal, 'C', 'es-CR') AS Monto
FROM DM.vw_Compras_Por_Mes
ORDER BY Anio DESC, Mes DESC;
```

---

## 🔧 Mantenimiento Regular

### Diario (Automático con SQL Agent)
```sql
-- Cargar compras del día
EXEC DM.sp_Cargar_Fact_Compras 
    @FechaInicio = CAST(GETDATE() AS DATE),
    @FechaFin = CAST(GETDATE() AS DATE);
```

### Semanal
```sql
-- Actualizar dimensiones
EXEC DM.sp_Cargar_Dim_Proveedor;
EXEC DM.sp_Cargar_Dim_Categoria;
EXEC DM.sp_Cargar_Dim_Producto;
```

### Mensual
```sql
-- Actualizar estadísticas
UPDATE STATISTICS DM.Fact_Compras WITH FULLSCAN;

-- Reorganizar índices (si fragmentación < 30%)
ALTER INDEX ALL ON DM.Fact_Compras REORGANIZE;

-- Reconstruir índices (si fragmentación > 30%)
-- ALTER INDEX ALL ON DM.Fact_Compras REBUILD;
```

---

## 📁 Archivos de Referencia

| Archivo | Cuándo Usar |
|---------|-------------|
| `DataMart_Compras.sql` | Primera vez (crear estructura) |
| `DataMart_Inicializacion.sql` | Primera vez o para recargar todo |
| `DataMart_Pruebas.sql` | Después de cambios importantes |
| `DataMart_Consultas_Ejemplo.sql` | Para aprender a consultar |
| `DataMart_Visualizacion.sql` | Para ver la estructura |
| `DataMart_Documentacion.md` | Referencia completa |
| `DataMart_README.md` | Guía rápida |

---

## 💡 Tips y Mejores Prácticas

### ✅ Hacer
- Ejecutar pruebas después de cada carga
- Mantener estadísticas actualizadas
- Revisar el log de la inicialización
- Hacer backup antes de recargas masivas
- Monitorear el tamaño del Data Mart

### ❌ No Hacer
- Modificar datos directamente en el DM (usar ETL)
- Eliminar índices sin entender el impacto
- Cargar datos sin verificar primero
- Ignorar advertencias de las pruebas
- Ejecutar en horarios de alta carga

---

## 🎓 Próximos Pasos

### Nivel Básico
1. Ejecutar las 3 primeras consultas recomendadas
2. Entender las 7 vistas principales
3. Programar carga diaria

### Nivel Intermedio
4. Conectar Power BI al Data Mart
5. Crear dashboards personalizados
6. Programar trabajos de mantenimiento

### Nivel Avanzado
7. Agregar nuevas métricas calculadas
8. Implementar particionamiento en Fact_Compras
9. Crear cubos OLAP en Analysis Services

---

## 📞 Ayuda Adicional

### Documentación
- Ver `DataMart_Documentacion.md` para detalles técnicos
- Ver `DataMart_Consultas_Ejemplo.sql` para más ejemplos

### Verificar Estado
```sql
-- Ver todo el estado del Data Mart
EXEC DM.sp_Estadisticas_DataMart;

-- Ejecutar todas las pruebas
-- Ver: DataMart_Pruebas.sql
```

---

## ✨ ¡Listo!

Después de seguir estos pasos, tendrás:

✅ Un Data Mart completamente funcional  
✅ Datos históricos cargados  
✅ 7 vistas analíticas listas para usar  
✅ Consultas de ejemplo para empezar  
✅ Proceso ETL automatizado  
✅ Pruebas que verifican la integridad  

**¡Hora de analizar datos! 📊🎉**

---

**Última actualización:** 2025-11-05  
**Versión:** 1.0
