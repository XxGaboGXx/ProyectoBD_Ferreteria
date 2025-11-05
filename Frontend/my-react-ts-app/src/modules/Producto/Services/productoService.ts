import api from '../../../services/api';
import type { Producto } from '../Types/Producto';

// Obtener todos los productos
export const fetchProductos = async (params?: { limit?: number; offset?: number }): Promise<Producto[]> => {
  try {
    const response = await api.get('/productos', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Obtener un producto por ID
export const fetchProductoById = async (id: number): Promise<Producto> => {
  try {
    const response = await api.get(`/productos/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener producto ${id}:`, error);
    throw error;
  }
};

// Obtener productos con stock bajo
export const fetchProductosLowStock = async (): Promise<Producto[]> => {
  try {
    const response = await api.get('/productos/low-stock');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    throw error;
  }
};

// Crear un nuevo producto
export const createProducto = async (producto: Omit<Producto, 'ProductoID'>): Promise<Producto> => {
  try {
    const response = await api.post('/productos', producto);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

// Actualizar un producto
export const updateProducto = async (id: number, producto: Partial<Producto>): Promise<Producto> => {
  try {
    const response = await api.put(`/productos/${id}`, producto);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar producto ${id}:`, error);
    throw error;
  }
};

// Eliminar un producto
export const deleteProducto = async (id: number): Promise<void> => {
  try {
    await api.delete(`/productos/${id}`);
  } catch (error) {
    console.error(`Error al eliminar producto ${id}:`, error);
    throw error;
  }
};

// Ajustar stock de un producto
export const adjustStock = async (
  id: number, 
  data: { cantidad: number; tipo: string; motivo?: string }
): Promise<any> => {
  try {
    const response = await api.post(`/productos/${id}/adjust-stock`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al ajustar stock del producto ${id}:`, error);
    throw error;
  }
};

// Obtener movimientos de inventario de un producto
export const fetchMovimientos = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/productos/${id}/movimientos`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener movimientos del producto ${id}:`, error);
    throw error;
  }
};

// Buscar productos por categoría
export const fetchProductosByCategoria = async (categoriaId: number): Promise<Producto[]> => {
  try {
    const response = await api.get(`/productos/categoria/${categoriaId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener productos de categoría ${categoriaId}:`, error);
    throw error;
  }
};

// Buscar productos por proveedor
export const fetchProductosByProveedor = async (proveedorId: number): Promise<Producto[]> => {
  try {
    const response = await api.get(`/productos/proveedor/${proveedorId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener productos del proveedor ${proveedorId}:`, error);
    throw error;
  }
};