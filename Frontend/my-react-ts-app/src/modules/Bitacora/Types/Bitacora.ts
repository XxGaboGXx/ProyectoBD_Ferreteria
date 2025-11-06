// src/modules/Bitacora/Types/Bitacora.ts
export interface BitacoraEntry {
  Id_bitacora: number;
  TablaAfectada: string;
  Accion: string;
  Fecha: string; // YYYY-MM-DD
  Hora: string;  // HH:mm:ss
  Descripcion: string | null;
}

export interface BitacoraListResponse {
  data: BitacoraEntry[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}
