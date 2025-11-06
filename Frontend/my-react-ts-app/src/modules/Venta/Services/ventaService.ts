import api from '../../../services/api';
import type { Venta } from '../Types/Venta';

export interface VentaListResponse {
  data: Venta[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Listar ventas
export const fetchVentas = async (params?: { page?: number; limit?: number; estado?: string; fechaInicio?: string; fechaFin?: string; clienteId?: number }): Promise<VentaListResponse> => {
  const response = await api.get('/ventas', { params });
  return response.data as { success: boolean; data: Venta[]; pagination: any } as any;
};

// Venta por id
export const fetchVentaById = async (id: number): Promise<Venta> => {
  const response = await api.get(`/ventas/${id}`);
  return response.data.data as Venta;
};

// Crear venta (estructura esperada por backend)
export type NuevaVenta = {
  Id_cliente: number;
  Id_colaborador: number;
  MetodoPago: string;
  Estado?: string;
  Productos: Array<{ Id_producto: number; Cantidad: number; PrecioUnitario: number }>;
};

export const createVenta = async (venta: NuevaVenta): Promise<any> => {
  console.log('📤 Creando venta:', JSON.stringify(venta, null, 2));
  const response = await api.post('/ventas', venta);
  return response.data.data;
};

// Actualizar venta
export const updateVenta = async (id: number, venta: Partial<NuevaVenta>): Promise<any> => {
  console.log('📤 Actualizando venta:', JSON.stringify(venta, null, 2));
  const response = await api.put(`/ventas/${id}`, venta);
  return response.data.data;
};

// Cancelar venta (el backend expone PATCH /ventas/:id/cancelar con { motivo })
export const cancelVenta = async (id: number, motivo: string): Promise<any> => {
  const response = await api.patch(`/ventas/${id}/cancelar`, { motivo });
  return response.data.data;
};

// Detalles de venta
export const fetchDetallesVenta = async (id: number): Promise<any[]> => {
  const response = await api.get(`/ventas/${id}/detalles`);
  return response.data.data;
};

// Extras del backend disponibles
export const fetchEstadisticasVentas = async (params?: { fechaInicio?: string; fechaFin?: string }) => {
  const response = await api.get('/ventas/estadisticas', { params });
  return response.data.data;
};

export const fetchTopProductosVendidos = async (params?: { limit?: number; fechaInicio?: string; fechaFin?: string }) => {
  const response = await api.get('/ventas/productos-mas-vendidos', { params });
  return response.data.data;
};