// src/modules/Venta/Types/Venta.ts
export interface Venta {
  Id_venta: number;
  Fecha: string; // DATETIME
  TotalVenta: number;
  MetodoPago: string;
  Estado: string;
  Id_cliente: number;
  Id_colaborador: number;
  detalles?: Array<{
    Id_producto: number;
    CantidadVenta: number;
    Cantidad: number;
    PrecioUnitario: number;
  }>;
}
