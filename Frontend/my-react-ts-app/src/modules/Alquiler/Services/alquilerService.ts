import api from '../../../services/api';
import type { Alquiler } from '../Types/Alquiler';

export interface AlquilerListResponse {
  data: Alquiler[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type NuevoAlquiler = {
  Id_cliente: number;
  Id_colaborador: number;
  detalles: Array<{
    Id_producto: number;
    Cantidad: number;
    Dias: number;
    TarifaDiaria: number;
    Deposito?: number;
  }>;
};

// Obtener todos los alquileres
export const fetchAlquileres = async (params?: { page?: number; limit?: number; estado?: string; clienteId?: number; fechaInicio?: string; fechaFin?: string }): Promise<AlquilerListResponse> => {
  const response = await api.get('/alquileres', { params });
  return response.data.data as AlquilerListResponse;
};

// Obtener alquileres activos
export const fetchAlquileresActivos = async (params?: { page?: number; limit?: number }): Promise<AlquilerListResponse> => {
  const response = await api.get('/alquileres/activos', { params });
  return response.data.data as AlquilerListResponse;
};

// Obtener alquileres vencidos
export const fetchAlquileresVencidos = async (params?: { page?: number; limit?: number }): Promise<AlquilerListResponse> => {
  const response = await api.get('/alquileres/vencidos', { params });
  return response.data.data as AlquilerListResponse;
};

// Crear un nuevo alquiler
export const createAlquiler = async (alquiler: NuevoAlquiler): Promise<any> => {
  const response = await api.post('/alquileres', alquiler);
  return response.data.data;
};

// Obtener un alquiler por ID (incluye detalles)
export const fetchAlquilerById = async (id: number): Promise<any> => {
  const response = await api.get(`/alquileres/${id}`);
  return response.data.data;
};

// Finalizar alquiler (devolver productos)
export const finalizarAlquiler = async (id: number, userId?: string): Promise<any> => {
  const response = await api.post(`/alquileres/${id}/finalizar`, { userId });
  return response.data.data;
};

// Extender alquiler (en días adicionales)
export const extenderAlquiler = async (id: number, diasAdicionales: number, userId?: string): Promise<any> => {
  const response = await api.post(`/alquileres/${id}/extender`, { diasAdicionales, userId });
  return response.data.data;
};

// Cancelar alquiler
export const cancelarAlquiler = async (id: number, motivo: string, userId?: string): Promise<any> => {
  const response = await api.post(`/alquileres/${id}/cancelar`, { motivo, userId });
  return response.data.data;
};

// Historial por cliente
export const fetchHistorialCliente = async (clienteId: number, params?: { page?: number; limit?: number }): Promise<AlquilerListResponse> => {
  const response = await api.get(`/alquileres/cliente/${clienteId}/historial`, { params });
  return response.data.data as AlquilerListResponse;
};

// Estadísticas
export const fetchEstadisticasAlquiler = async (): Promise<any> => {
  const response = await api.get('/alquileres/estadisticas');
  return response.data.data;
};

// Nota: No hay endpoints para DELETE o PUT en backend; evitamos exponerlos aquí.