import api from '../../../services/api';
import type { Compra } from '../Types/Compra';

// Obtener todas las compras
export const fetchCompras = async (): Promise<Compra[]> => {
  try {
    const response = await api.get('/compras');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener compras:', error);
    throw error;
  }
};

// Crear una nueva compra
export const createCompra = async (compra: Partial<Compra>): Promise<Compra> => {
  try {
    const response = await api.post('/compras', compra);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear compra:', error);
    throw error;
  }
};

// Actualizar una compra
export const updateCompra = async (id: number, compra: Partial<Compra>): Promise<Compra> => {
  try {
    const response = await api.put(`/compras/${id}`, compra);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar compra ${id}:`, error);
    throw error;
  }
};

// Obtener una compra por ID
export const fetchCompraById = async (id: number): Promise<Compra> => {
  try {
    const response = await api.get(`/compras/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener compra ${id}:`, error);
    throw error;
  }
};

// Eliminar una compra (si existe en tu backend)
export const deleteCompra = async (id: number): Promise<void> => {
  try {
    await api.delete(`/compras/${id}`);
  } catch (error) {
    console.error(`Error al eliminar compra ${id}:`, error);
    throw error;
  }
};

// Obtener detalles de una compra con productos
export const fetchDetallesCompra = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/compras/${id}/detalles`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener detalles de compra ${id}:`, error);
    throw error;
  }
};