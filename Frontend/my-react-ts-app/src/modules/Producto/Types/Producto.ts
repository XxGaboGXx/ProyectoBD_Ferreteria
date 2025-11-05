
    // src/modules/Producto/Types/Producto.ts
export interface Producto {
  Id_Producto: number;
  Nombre: string;
  Descripcion: string;
  PrecioCompra: number;
  PrecioVenta: number;
  CodigoBarra: string;
  CantidadActual: number;
  CantidadMinima: number;
  FechaEntrada: string;
  FechaSalida: string;
  ID_categoria: number;
}