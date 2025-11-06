import api from '../../../services/api';
import type { Cliente, NuevoCliente } from '../Types/Cliente';

export interface ClienteListResponse {
  data: Cliente[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Listar clientes con paginación y filtros (Nombre)
export const fetchClientes = async (params?: { page?: number; limit?: number; Nombre?: string }): Promise<ClienteListResponse> => {
  const response = await api.get('/clientes', { params });
  return response.data.data as ClienteListResponse;
};

// Obtener un cliente por ID
export const fetchClienteById = async (id: number): Promise<Cliente> => {
  const response = await api.get(`/clientes/${id}`);
  return response.data.data as Cliente;
};

// Crear un nuevo cliente
export const createCliente = async (cliente: NuevoCliente): Promise<Cliente> => {
  const response = await api.post('/clientes', cliente);
  return response.data.data as Cliente;
};

// Actualizar un cliente
export const updateCliente = async (id: number, cliente: Partial<NuevoCliente>): Promise<Cliente> => {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data.data as Cliente;
};

// Eliminar un cliente
export const deleteCliente = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};

// Historial de compras/ventas del cliente (paginado)
export const fetchHistorialCliente = async (id: number, params?: { page?: number; limit?: number }): Promise<ClienteListResponse> => {
  const response = await api.get(`/clientes/${id}/historial`, { params });
  return response.data.data as ClienteListResponse;
};

// Estadísticas de un cliente
export const fetchEstadisticasCliente = async (id: number): Promise<any> => {
  const response = await api.get(`/clientes/${id}/estadisticas`);
  return response.data.data;
};

// Nota: Rutas como /cedula/:cedula, /inactivos, desactivar/reactivar no están disponibles en el backend actual o lanzan error controlado.