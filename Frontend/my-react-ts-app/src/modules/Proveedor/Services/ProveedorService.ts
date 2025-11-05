import api from '../../../services/api';
import type { Proveedor } from '../Types/Proveedor';

// Obtener todos los proveedores
export const fetchProveedores = async (): Promise<Proveedor[]> => {
  try {
    const response = await api.get('/proveedores');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

// Obtener un proveedor por ID
export const fetchProveedorById = async (id: number): Promise<Proveedor> => {
  try {
    const response = await api.get(`/proveedores/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener proveedor ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo proveedor
export const createProveedor = async (proveedor: Omit<Proveedor, 'Id_proveedor'>): Promise<Proveedor> => {
  try {
    const response = await api.post('/proveedores', proveedor);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    throw error;
  }
};

// Actualizar un proveedor
export const updateProveedor = async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
  try {
    const response = await api.put(`/proveedores/${id}`, proveedor);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar proveedor ${id}:`, error);
    throw error;
  }
};

// Eliminar un proveedor
export const deleteProveedor = async (id: number): Promise<void> => {
  try {
    await api.delete(`/proveedores/${id}`);
  } catch (error) {
    console.error(`Error al eliminar proveedor ${id}:`, error);
    throw error;
  }
};

// Obtener historial de compras de un proveedor
export const fetchHistorialCompras = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/proveedores/${id}/historial`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener historial de proveedor ${id}:`, error);
    throw error;
  }
};

// Obtener productos de un proveedor
export const fetchProductosProveedor = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/proveedores/${id}/productos`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener productos del proveedor ${id}:`, error);
    throw error;
  }
};