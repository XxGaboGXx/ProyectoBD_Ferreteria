import api from '../../../services/api';
import type { Producto } from '../Types/Producto';

// Tipos de respuesta del backend
export interface ProductoListResponse {
  data: Producto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Obtener todos los productos (respeta la forma del backend)
export const fetchProductos = async (
  params?: { page?: number; limit?: number; [key: string]: any }
): Promise<ProductoListResponse> => {
  const response = await api.get('/productos', { params });
  // backend: { success, message, data: { data: Producto[], pagination } }
  return response.data.data as ProductoListResponse;
};

// Obtener un producto por ID
export const fetchProductoById = async (id: number): Promise<Producto> => {
  const response = await api.get(`/productos/${id}`);
  return response.data.data as Producto;
};

// Obtener productos con stock bajo
export const fetchProductosLowStock = async (): Promise<Producto[]> => {
  const response = await api.get('/productos/bajo-stock'); // ruta real en el backend
  return response.data.data as Producto[];
};

// Crear un nuevo producto
export const createProducto = async (
  producto: Partial<Producto>
): Promise<Producto> => {
  const response = await api.post('/productos', producto);
  return response.data.data as Producto;
};

// Actualizar un producto
export const updateProducto = async (id: number, producto: Partial<Producto>): Promise<Producto> => {
  const response = await api.put(`/productos/${id}`, producto);
  return response.data.data as Producto;
};

// Eliminar un producto
export const deleteProducto = async (id: number): Promise<void> => {
  await api.delete(`/productos/${id}`);
};

// Ajustar stock de un producto
export const adjustStock = async (
  id: number,
  data: { CantidadAjuste: number; TipoMovimiento: string; Descripcion?: string }
): Promise<any> => {
  const response = await api.post(`/productos/${id}/ajustar`, data);
  return response.data.data;
};

// Obtener movimientos de inventario de un producto
export const fetchMovimientos = async (
  id: number,
  params?: { page?: number; limit?: number; tipo?: string; fechaInicio?: string; fechaFin?: string }
): Promise<any> => {
  const response = await api.get(`/productos/${id}/movimientos`, { params });
  return response.data.data;
};

// Buscar productos por categoría
export const fetchProductosByCategoria = async (categoriaId: number, params?: { page?: number; limit?: number }): Promise<ProductoListResponse> => {
  const response = await api.get(`/productos/categoria/${categoriaId}`, { params });
  return response.data.data as ProductoListResponse;
};

// Productos por proveedor (usa endpoint de proveedores)
export const fetchProductosByProveedor = async (proveedorId: number): Promise<Producto[]> => {
  const response = await api.get(`/proveedores/${proveedorId}/productos`);
  return response.data.data as Producto[];
};