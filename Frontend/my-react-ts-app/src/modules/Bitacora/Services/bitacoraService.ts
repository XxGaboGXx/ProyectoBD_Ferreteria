// src/modules/Bitacora/Services/bitacoraService.ts
import api from '../../../services/api';
import type { BitacoraEntry } from '../Types/Bitacora';

// Nota importante: el backend no expone endpoints generales de bitácora.
// Actualmente, la bitácora está disponible por producto en:
//   GET /productos/:id/movimientos
// Usamos ese endpoint para consultar registros por producto.

export const fetchBitacoraByProducto = async (
  productoId: number,
  params?: { page?: number; limit?: number; fechaInicio?: string; fechaFin?: string }
): Promise<BitacoraEntry[]> => {
  const response = await api.get(`/productos/${productoId}/movimientos`, { params });
  return response.data.data as BitacoraEntry[];
};
