import api from '../../../services/api';
import type { Proveedor } from '../Types/Proveedor';

export interface ProveedorListResponse {
  data: Proveedor[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Obtener todos los proveedores (con paginación y filtros)
export const fetchProveedores = async (
  params?: { page?: number; limit?: number; nombre?: string; telefono?: string; correo?: string }
): Promise<ProveedorListResponse> => {
  const response = await api.get('/proveedores', { params });
  return response.data.data as ProveedorListResponse;
};

// Obtener un proveedor por ID
export const fetchProveedorById = async (id: number): Promise<Proveedor> => {
  const response = await api.get(`/proveedores/${id}`);
  return response.data.data || response.data;
};

// Crear un nuevo proveedor
export const createProveedor = async (proveedor: Omit<Proveedor, 'Id_proveedor'>): Promise<Proveedor> => {
  const response = await api.post('/proveedores', proveedor);
  return response.data.data || response.data;
};

// Actualizar un proveedor
export const updateProveedor = async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
  const response = await api.put(`/proveedores/${id}`, proveedor);
  return response.data.data || response.data;
};

// Eliminar un proveedor
export const deleteProveedor = async (id: number): Promise<void> => {
  await api.delete(`/proveedores/${id}`);
};

// Obtener historial de compras de un proveedor (ruta real: /:id/historial-compras)
export const fetchHistorialCompras = async (
  id: number,
  params?: { page?: number; limit?: number; fechaInicio?: string; fechaFin?: string }
): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const response = await api.get(`/proveedores/${id}/historial-compras`, { params });
  return response.data.data;
};

// Obtener productos de un proveedor
export const fetchProductosProveedor = async (
  id: number,
  params?: { page?: number; limit?: number }
): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const response = await api.get(`/proveedores/${id}/productos`, { params });
  return response.data.data;
};

// Obtener estadísticas de un proveedor
export const fetchEstadisticasProveedor = async (id: number): Promise<any> => {
  const response = await api.get(`/proveedores/${id}/estadisticas`);
  return response.data.data;
};