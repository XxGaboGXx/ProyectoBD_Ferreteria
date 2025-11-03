# Endpoints del Módulo de Compras

Documentación de los endpoints disponibles para el módulo de compras del sistema de ferretería.

---

## **1. Gestión de Compras**

### **Listar todas las compras**
```http
GET /api/compras
```
**Descripción:** Obtiene el listado completo de todas las compras registradas en el sistema.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "Id_compra": 1,
      "Id_proveedor": 1,
      "NombreProveedor": "Proveedor XYZ",
      "NumeroFactura": "FACT-2025-001",
      "FechaCompra": "2025-01-15T10:30:00Z",
      "Total": 760000
    },
    {
      "Id_compra": 2,
      "Id_proveedor": 2,
      "NombreProveedor": "Distribuidora ABC",
      "NumeroFactura": "FACT-2025-002",
      "FechaCompra": "2025-01-20T14:45:00Z",
      "Total": 1250000
    }
  ],
  "count": 2
}
```

---

### **Filtrar compras por proveedor**
```http
GET /api/compras?Id_proveedor=1
```
**Descripción:** Obtiene todas las compras realizadas a un proveedor específico.

**Parámetros de consulta:**
- `Id_proveedor` (number): ID del proveedor

**Ejemplo:**
```http
GET /api/compras?Id_proveedor=1
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "Id_compra": 1,
      "Id_proveedor": 1,
      "NombreProveedor": "Proveedor XYZ",
      "NumeroFactura": "FACT-2025-001",
      "FechaCompra": "2025-01-15T10:30:00Z",
      "Total": 760000
    }
  ],
  "count": 1
}
```

---

### **Filtrar compras por rango de fechas**
```http
GET /api/compras?fechaInicio=2025-01-01&fechaFin=2025-12-31
```
**Descripción:** Obtiene todas las compras realizadas dentro de un rango de fechas específico.

**Parámetros de consulta:**
- `fechaInicio` (date): Fecha inicial en formato YYYY-MM-DD
- `fechaFin` (date): Fecha final en formato YYYY-MM-DD

**Ejemplo:**
```http
GET /api/compras?fechaInicio=2025-01-01&fechaFin=2025-12-31
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "Id_compra": 1,
      "Id_proveedor": 1,
      "NombreProveedor": "Proveedor XYZ",
      "NumeroFactura": "FACT-2025-001",
      "FechaCompra": "2025-01-15T10:30:00Z",
      "Total": 760000
    },
    {
      "Id_compra": 2,
      "Id_proveedor": 2,
      "NombreProveedor": "Distribuidora ABC",
      "NumeroFactura": "FACT-2025-002",
      "FechaCompra": "2025-01-20T14:45:00Z",
      "Total": 1250000
    }
  ],
  "count": 2,
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-31"
}
```

---

### **Paginación de compras**
```http
GET /api/compras?page=1&limit=20
```
**Descripción:** Obtiene las compras con paginación para manejar grandes volúmenes de datos.

**Parámetros de consulta:**
- `page` (number): Número de página (por defecto: 1)
- `limit` (number): Cantidad de registros por página (por defecto: 10, máximo: 100)

**Ejemplo:**
```http
GET /api/compras?page=1&limit=20
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "Id_compra": 1,
      "Id_proveedor": 1,
      "NombreProveedor": "Proveedor XYZ",
      "NumeroFactura": "FACT-2025-001",
      "FechaCompra": "2025-01-15T10:30:00Z",
      "Total": 760000
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 100,
    "limit": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### **Ver compra específica**
```http
GET /api/compras/:id
```
**Descripción:** Obtiene los detalles completos de una compra específica, incluyendo todos sus productos.

**Parámetros de ruta:**
- `id` (number): ID de la compra

**Ejemplo:**
```http
GET /api/compras/1
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "Id_compra": 1,
    "Id_proveedor": 1,
    "NombreProveedor": "Proveedor XYZ",
    "NumeroFactura": "FACT-2025-001",
    "FechaCompra": "2025-01-15T10:30:00Z",
    "Total": 760000,
    "detalles": [
      {
        "Id_detalle": 1,
        "Id_producto": 2,
        "NombreProducto": "Martillo",
        "CantidadCompra": 50,
        "PrecioUnitario": 8000,
        "Subtotal": 400000
      },
      {
        "Id_detalle": 2,
        "Id_producto": 3,
        "NombreProducto": "Destornillador",
        "CantidadCompra": 30,
        "PrecioUnitario": 12000,
        "Subtotal": 360000
      }
    ]
  }
}
```

**Respuesta de error (404):**
```json
{
  "success": false,
  "message": "Compra no encontrada",
  "error": {
    "code": "NOT_FOUND",
    "details": "No existe una compra con el ID 999"
  }
}
```

---

### **Crear nueva compra**
```http
POST /api/compras
```
**Descripción:** Registra una nueva compra en el sistema con sus detalles de productos.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "Id_proveedor": 1,
  "NumeroFactura": "FACT-2025-001",
  "detalles": [
    {
      "Id_producto": 2,
      "CantidadCompra": 50,
      "PrecioUnitario": 8000
    },
    {
      "Id_producto": 3,
      "CantidadCompra": 30,
      "PrecioUnitario": 12000
    }
  ]
}
```

**Campos requeridos:**
- `Id_proveedor` (number): ID del proveedor
- `NumeroFactura` (string): Número único de factura
- `detalles` (array): Array de productos comprados
  - `Id_producto` (number): ID del producto
  - `CantidadCompra` (number): Cantidad comprada
  - `PrecioUnitario` (number): Precio unitario de compra

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Compra registrada exitosamente",
  "data": {
    "Id_compra": 15,
    "Id_proveedor": 1,
    "NumeroFactura": "FACT-2025-001",
    "FechaCompra": "2025-11-03T04:18:13Z",
    "Total": 760000,
    "detalles": [
      {
        "Id_detalle": 30,
        "Id_producto": 2,
        "CantidadCompra": 50,
        "PrecioUnitario": 8000,
        "Subtotal": 400000
      },
      {
        "Id_detalle": 31,
        "Id_producto": 3,
        "CantidadCompra": 30,
        "PrecioUnitario": 12000,
        "Subtotal": 360000
      }
    ]
  }
}
```

**Respuesta de error (400):**
```json
{
  "success": false,
  "message": "Datos inválidos",
  "errors": [
    {
      "field": "NumeroFactura",
      "message": "El número de factura ya existe"
    }
  ]
}
```

**Respuesta de error (404):**
```json
{
  "success": false,
  "message": "Proveedor no encontrado",
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "details": "No existe un proveedor con el ID 999"
  }
}
```

---

## **2. Estadísticas y Reportes**

### **Estadísticas generales**
```http
GET /api/compras/estadisticas
```
**Descripción:** Obtiene estadísticas generales de todas las compras realizadas.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "totalCompras": 150,
    "montoTotalCompras": 45000000,
    "promedioCompra": 300000,
    "compraMasAlta": {
      "Id_compra": 45,
      "NumeroFactura": "FACT-2025-045",
      "Total": 2500000,
      "FechaCompra": "2025-10-15T10:00:00Z"
    },
    "compraMasBaja": {
      "Id_compra": 12,
      "NumeroFactura": "FACT-2025-012",
      "Total": 50000,
      "FechaCompra": "2025-03-20T14:30:00Z"
    },
    "proveedorMasFrecuente": {
      "Id_proveedor": 1,
      "NombreProveedor": "Proveedor XYZ",
      "TotalCompras": 45
    }
  }
}
```

---

### **Estadísticas por rango de fechas**
```http
GET /api/compras/estadisticas?fechaInicio=2025-01-01&fechaFin=2025-12-31
```
**Descripción:** Obtiene estadísticas de compras filtradas por un rango de fechas específico.

**Parámetros de consulta:**
- `fechaInicio` (date): Fecha inicial en formato YYYY-MM-DD
- `fechaFin` (date): Fecha final en formato YYYY-MM-DD

**Ejemplo:**
```http
GET /api/compras/estadisticas?fechaInicio=2025-01-01&fechaFin=2025-12-31
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "fechaInicio": "2025-01-01",
      "fechaFin": "2025-12-31"
    },
    "totalCompras": 120,
    "montoTotalCompras": 38000000,
    "promedioCompra": 316666.67,
    "compraPorMes": [
      {
        "mes": "Enero",
        "totalCompras": 12,
        "montoTotal": 3600000
      },
      {
        "mes": "Febrero",
        "totalCompras": 10,
        "montoTotal": 2800000
      }
    ]
  }
}
```

---

### **Productos más comprados**
```http
GET /api/compras/productos-mas-comprados
```
**Descripción:** Obtiene el ranking de los productos más comprados en el sistema.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "Id_producto": 2,
      "NombreProducto": "Martillo",
      "TotalComprado": 1500,
      "MontoTotal": 12000000,
      "VecesComprado": 45
    },
    {
      "Id_producto": 3,
      "NombreProducto": "Destornillador",
      "TotalComprado": 1200,
      "MontoTotal": 14400000,
      "VecesComprado": 38
    },
    {
      "Id_producto": 5,
      "NombreProducto": "Taladro",
      "TotalComprado": 350,
      "MontoTotal": 52500000,
      "VecesComprado": 25
    }
  ]
}
```

---

### **Top productos más comprados con límite**
```http
GET /api/compras/productos-mas-comprados?limit=10
```
**Descripción:** Obtiene el top N de productos más comprados.

**Parámetros de consulta:**
- `limit` (number): Cantidad de productos a retornar (por defecto: 10)

**Ejemplo:**
```http
GET /api/compras/productos-mas-comprados?limit=10
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "ranking": 1,
      "Id_producto": 2,
      "NombreProducto": "Martillo",
      "TotalComprado": 1500,
      "MontoTotal": 12000000,
      "VecesComprado": 45
    },
    {
      "ranking": 2,
      "Id_producto": 3,
      "NombreProducto": "Destornillador",
      "TotalComprado": 1200,
      "MontoTotal": 14400000,
      "VecesComprado": 38
    }
  ],
  "limit": 10,
  "count": 2
}
```

---

## **3. Códigos de Estado HTTP**

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Solicitud exitosa (GET, PUT, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 400 | Bad Request | Datos inválidos o faltantes |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: factura duplicada) |
| 500 | Internal Server Error | Error del servidor |

---

## **4. Ejemplos de Uso con cURL**

### **Crear una compra**
```bash
curl -X POST http://localhost:3000/api/compras \
  -H "Content-Type: application/json" \
  -d '{
    "Id_proveedor": 1,
    "NumeroFactura": "FACT-2025-001",
    "detalles": [
      {
        "Id_producto": 2,
        "CantidadCompra": 50,
        "PrecioUnitario": 8000
      },
      {
        "Id_producto": 3,
        "CantidadCompra": 30,
        "PrecioUnitario": 12000
      }
    ]
  }'
```

### **Obtener compra específica**
```bash
curl -X GET http://localhost:3000/api/compras/1
```

### **Filtrar por proveedor**
```bash
curl -X GET "http://localhost:3000/api/compras?Id_proveedor=1"
```

### **Obtener estadísticas**
```bash
curl -X GET http://localhost:3000/api/compras/estadisticas
```

### **Top 10 productos más comprados**
```bash
curl -X GET "http://localhost:3000/api/compras/productos-mas-comprados?limit=10"
```

---

## **5. Ejemplos de Uso con JavaScript (Fetch API)**

### **Crear una compra**
```javascript
fetch('http://localhost:3000/api/compras', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Id_proveedor: 1,
    NumeroFactura: 'FACT-2025-001',
    detalles: [
      {
        Id_producto: 2,
        CantidadCompra: 50,
        PrecioUnitario: 8000
      },
      {
        Id_producto: 3,
        CantidadCompra: 30,
        PrecioUnitario: 12000
      }
    ]
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### **Obtener compras con filtros**
```javascript
const params = new URLSearchParams({
  fechaInicio: '2025-01-01',
  fechaFin: '2025-12-31',
  page: 1,
  limit: 20
});

fetch(`http://localhost:3000/api/compras?${params}`)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### **Obtener estadísticas**
```javascript
fetch('http://localhost:3000/api/compras/estadisticas?fechaInicio=2025-01-01&fechaFin=2025-12-31')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

---

## **6. Notas Importantes**

1. **Validaciones:**
   - El número de factura debe ser único en el sistema
   - El proveedor debe existir y estar activo
   - Los productos deben existir en el inventario
   - Las cantidades y precios deben ser números positivos

2. **Transacciones:**
   - La creación de una compra debe ser una transacción atómica
   - Si falla algún detalle, se debe revertir toda la compra

3. **Actualización de Inventario:**
   - Al registrar una compra, se debe actualizar automáticamente el stock de los productos

4. **Fechas:**
   - Todas las fechas se manejan en formato ISO 8601 (UTC)
   - Las fechas de filtro aceptan formato YYYY-MM-DD

5. **Paginación:**
   - El límite máximo recomendado es 100 registros por página
   - Por defecto se retornan 10 registros si no se especifica el límite

---

**Última actualización:** 2025-11-03  
**Versión:** 1.0
