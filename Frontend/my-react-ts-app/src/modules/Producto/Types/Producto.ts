// src/modules/Producto/Types/Producto.ts
// Alineado con el backend (nombres y tipos)
export interface Producto {
  Id_producto: number;
  Nombre: string;
  Descripcion?: string | null;
  PrecioCompra?: number | null;
  PrecioVenta: number;
  CodigoBarra?: string | null;
  CantidadActual: number;
  CantidadMinima?: number | null;
  FechaEntrada?: string | null;
  FechaSalida?: string | null;
  Id_categoria?: number | null;
}