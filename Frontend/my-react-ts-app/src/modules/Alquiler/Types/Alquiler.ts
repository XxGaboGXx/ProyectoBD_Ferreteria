// src/modules/Alquiler/Types/Alquiler.ts
export interface Alquiler {
  Id_alquiler: number;
  FechaInicio: string; // DATETIME
  FechaFin: string | null; // DATETIME
  Estado: string; // 'Pendiente', 'Activo', 'Finalizado', etc.
  TotalAlquiler: number;
  Id_cliente: number;
  Id_colaborador: number;
}