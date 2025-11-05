import api from '../../../services/api';
import type { Colaborador } from '../Types/Colaborador';

// Obtener todos los colaboradores
export const fetchColaboradores = async (): Promise<Colaborador[]> => {
  try {
    const response = await api.get('/colaboradores');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener colaboradores:', error);
    throw error;
  }
};

// Obtener un colaborador por ID
export const fetchColaboradorById = async (id: number): Promise<Colaborador> => {
  try {
    const response = await api.get(`/colaboradores/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener colaborador ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo colaborador
export const createColaborador = async (colaborador: Omit<Colaborador, 'Id_colaborador'>): Promise<Colaborador> => {
  try {
    const response = await api.post('/colaboradores', colaborador);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear colaborador:', error);
    throw error;
  }
};

// Actualizar un colaborador
export const updateColaborador = async (id: number, colaborador: Partial<Colaborador>): Promise<Colaborador> => {
  try {
    const response = await api.put(`/colaboradores/${id}`, colaborador);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar colaborador ${id}:`, error);
    throw error;
  }
};

// Eliminar un colaborador
export const deleteColaborador = async (id: number): Promise<void> => {
  try {
    await api.delete(`/colaboradores/${id}`);
  } catch (error) {
    console.error(`Error al eliminar colaborador ${id}:`, error);
    throw error;
  }
};

// Obtener ventas realizadas por un colaborador
export const fetchVentasColaborador = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/colaboradores/${id}/ventas`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener ventas del colaborador ${id}:`, error);
    throw error;
  }
};

// Obtener estadísticas de un colaborador
export const fetchEstadisticasColaborador = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/colaboradores/${id}/estadisticas`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener estadísticas del colaborador ${id}:`, error);
    throw error;
  }
};

// Actualizar contraseña de un colaborador
export const updatePasswordColaborador = async (id: number, data: { password: string }): Promise<void> => {
  try {
    await api.put(`/colaboradores/${id}/password`, data);
  } catch (error) {
    console.error(`Error al actualizar contraseña del colaborador ${id}:`, error);
    throw error;
  }
};