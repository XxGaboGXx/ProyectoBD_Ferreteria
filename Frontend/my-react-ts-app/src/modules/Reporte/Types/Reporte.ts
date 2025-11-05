// src/modules/Reporte/Types/Reporte.ts
export interface ReporteVentas {
  Fecha: string;
  Total: number;
  CantidadVentas: number;
}

export interface ReporteCompras {
  Fecha: string;
  Total: number;
  CantidadCompras: number;
}

export interface ProductoStockBajo {
  Id_Producto: number;
  Nombre: string;
  CantidadActual: number;
  CantidadMinima: number;
}