import api from '../../../services/api';
import type { Compra } from '../Types/Compra';

export interface CompraListResponse {
  data: Compra[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Obtener todas las compras (respeta estructura del backend)
export const fetchCompras = async (params?: { page?: number; limit?: number; Id_proveedor?: number; fechaInicio?: string; fechaFin?: string }): Promise<CompraListResponse> => {
  const response = await api.get('/compras', { params });
  return response.data.data as CompraListResponse;
};

// Obtener una compra por ID
export const fetchCompraById = async (id: number): Promise<any> => {
  const response = await api.get(`/compras/${id}`);
  return response.data.data; // incluye compra + detalles
};

// Crear una nueva compra (payload esperado por backend)
export type NuevaCompra = {
  Id_proveedor: number;
  FechaCompra?: string; // ISO opcional
  NumeroFactura?: string | null;
  TotalCompra?: number; // el backend recalcula si no se envía
  detalles: Array<{ Id_producto: number; CantidadCompra: number; PrecioUnitario: number }>;
};

export const createCompra = async (compra: NuevaCompra): Promise<any> => {
  const response = await api.post('/compras', compra);
  return response.data.data;
};

// Nota: Backend no expone PUT/DELETE ni /detalles. Si se agregan, podemos sumar aquí.