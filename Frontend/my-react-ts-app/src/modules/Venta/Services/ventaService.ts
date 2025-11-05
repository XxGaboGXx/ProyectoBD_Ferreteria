import api from '../../../services/api';
import type { Venta } from '../Types/Venta';

// Obtener todas las ventas
export const fetchVentas = async (): Promise<Venta[]> => {
  try {
    const response = await api.get('/ventas');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    throw error;
  }
};

// Obtener una venta por ID
export const fetchVentaById = async (id: number): Promise<Venta> => {
  try {
    const response = await api.get(`/ventas/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener venta ${id}:`, error);
    throw error;
  }
};

// Crear una nueva venta
export const createVenta = async (venta: Omit<Venta, 'Id_venta'>): Promise<Venta> => {
  try {
    const response = await api.post('/ventas', venta);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
};

// Actualizar una venta
export const updateVenta = async (id: number, venta: Partial<Venta>): Promise<Venta> => {
  try {
    const response = await api.put(`/ventas/${id}`, venta);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar venta ${id}:`, error);
    throw error;
  }
};

// Cancelar una venta
export const cancelVenta = async (id: number): Promise<any> => {
  try {
    const response = await api.post(`/ventas/${id}/cancel`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al cancelar venta ${id}:`, error);
    throw error;
  }
};

// Eliminar una venta
export const deleteVenta = async (id: number): Promise<void> => {
  try {
    await api.delete(`/ventas/${id}`);
  } catch (error) {
    console.error(`Error al eliminar venta ${id}:`, error);
    throw error;
  }
};

// Obtener detalles de una venta con productos
export const fetchDetallesVenta = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/ventas/${id}/detalles`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener detalles de venta ${id}:`, error);
    throw error;
  }
};

// Obtener ventas por cliente
export const fetchVentasByCliente = async (clienteId: number): Promise<Venta[]> => {
  try {
    const response = await api.get(`/ventas/cliente/${clienteId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener ventas del cliente ${clienteId}:`, error);
    throw error;
  }
};

// Obtener ventas por rango de fechas
export const fetchVentasByFecha = async (params: { fechaInicio: string; fechaFin: string }): Promise<Venta[]> => {
  try {
    const response = await api.get('/ventas/fecha', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas por fecha:', error);
    throw error;
  }
};

// Obtener ventas del día
export const fetchVentasDelDia = async (): Promise<Venta[]> => {
  try {
    const response = await api.get('/ventas/hoy');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    throw error;
  }
};