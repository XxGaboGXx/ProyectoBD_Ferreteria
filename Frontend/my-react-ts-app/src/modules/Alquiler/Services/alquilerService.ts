import api from '../../../services/api';
import type { Alquiler } from '../Types/Alquiler';

// Obtener todos los alquileres
export const fetchAlquileres = async (): Promise<Alquiler[]> => {
  try {
    const response = await api.get('/alquileres');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener alquileres:', error);
    throw error;
  }
};

// Obtener alquileres activos
export const fetchAlquileresActivos = async (): Promise<Alquiler[]> => {
  try {
    const response = await api.get('/alquileres/activos');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener alquileres activos:', error);
    throw error;
  }
};

// Obtener alquileres vencidos
export const fetchAlquileresVencidos = async (): Promise<Alquiler[]> => {
  try {
    const response = await api.get('/alquileres/vencidos');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener alquileres vencidos:', error);
    throw error;
  }
};

// Crear un nuevo alquiler
export const createAlquiler = async (alquiler: Partial<Alquiler>): Promise<Alquiler> => {
  try {
    const response = await api.post('/alquileres', alquiler);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear alquiler:', error);
    throw error;
  }
};

// Actualizar un alquiler
export const updateAlquiler = async (id: number, alquiler: Partial<Alquiler>): Promise<Alquiler> => {
  try {
    const response = await api.put(`/alquileres/${id}`, alquiler);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar alquiler ${id}:`, error);
    throw error;
  }
};

// Obtener un alquiler por ID
export const fetchAlquilerById = async (id: number): Promise<Alquiler> => {
  try {
    const response = await api.get(`/alquileres/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener alquiler ${id}:`, error);
    throw error;
  }
};

// Finalizar alquiler (devolver producto)
export const finalizarAlquiler = async (id: number): Promise<any> => {
  try {
    const response = await api.post(`/alquileres/${id}/finalizar`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al finalizar alquiler ${id}:`, error);
    throw error;
  }
};

// Extender alquiler (cambiar fecha de fin)
export const extenderAlquiler = async (id: number, data: { nuevaFechaFin: string }): Promise<any> => {
  try {
    const response = await api.post(`/alquileres/${id}/extender`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al extender alquiler ${id}:`, error);
    throw error;
  }
};

// Cancelar alquiler
export const cancelarAlquiler = async (id: number): Promise<any> => {
  try {
    const response = await api.post(`/alquileres/${id}/cancelar`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al cancelar alquiler ${id}:`, error);
    throw error;
  }
};

// Eliminar un alquiler (si existe en el backend)
export const deleteAlquiler = async (id: number): Promise<void> => {
  try {
    await api.delete(`/alquileres/${id}`);
  } catch (error) {
    console.error(`Error al eliminar alquiler ${id}:`, error);
    throw error;
  }
};

// Obtener detalles del alquiler con productos
export const fetchDetallesAlquiler = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/alquileres/${id}/detalles`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener detalles del alquiler ${id}:`, error);
    throw error;
  }
};