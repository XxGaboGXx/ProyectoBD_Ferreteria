import api from '../../../services/api';
import type { Cliente } from '../Types/Cliente';

// Obtener todos los clientes
export const fetchClientes = async (): Promise<Cliente[]> => {
  try {
    const response = await api.get('/clientes');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

// Obtener un cliente por ID
export const fetchClienteById = async (id: number): Promise<Cliente> => {
  try {
    const response = await api.get(`/clientes/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener cliente ${id}:`, error);
    throw error;
  }
};

// Obtener un cliente por cédula
export const fetchClienteByCedula = async (cedula: string): Promise<Cliente> => {
  try {
    const response = await api.get(`/clientes/cedula/${cedula}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener cliente con cédula ${cedula}:`, error);
    throw error;
  }
};

// Crear un nuevo cliente
export const createCliente = async (cliente: Omit<Cliente, 'Id_cliente'>): Promise<Cliente> => {
  try {
    const response = await api.post('/clientes', cliente);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
};

// Actualizar un cliente
export const updateCliente = async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
  try {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar cliente ${id}:`, error);
    throw error;
  }
};

// Eliminar un cliente
export const deleteCliente = async (id: number): Promise<void> => {
  try {
    await api.delete(`/clientes/${id}`);
  } catch (error) {
    console.error(`Error al eliminar cliente ${id}:`, error);
    throw error;
  }
};

// Obtener historial de compras/ventas de un cliente
export const fetchHistorialCliente = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/clientes/${id}/historial`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener historial del cliente ${id}:`, error);
    throw error;
  }
};

// Obtener estadísticas de un cliente
export const fetchEstadisticasCliente = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/clientes/${id}/estadisticas`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener estadísticas del cliente ${id}:`, error);
    throw error;
  }
};

// Obtener alquileres activos de un cliente
export const fetchAlquileresCliente = async (id: number): Promise<any[]> => {
  try {
    const response = await api.get(`/clientes/${id}/alquileres`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al obtener alquileres del cliente ${id}:`, error);
    throw error;
  }
};

// Actualizar línea de crédito de un cliente
export const updateLineaCredito = async (id: number, data: { linea_credito: number }): Promise<Cliente> => {
  try {
    const response = await api.put(`/clientes/${id}/linea-credito`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error al actualizar línea de crédito del cliente ${id}:`, error);
    throw error;
  }
};