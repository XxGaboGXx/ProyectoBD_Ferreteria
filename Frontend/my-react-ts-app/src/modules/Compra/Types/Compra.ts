// src/modules/Compra/Types/Compra.ts
export interface Compra {
  Id_compra: number;
  FechaCompra: string; // DATETIME
  TotalCompra: number;
  NumeroFactura: string | null;
  Id_proveedor: number;
}

export interface CompraDetalle {
  Id_detalle_compra?: number;
  Id_compra?: number;
  Id_producto: number;
  CantidadCompra: number;
  PrecioUnitario: number;
  Subtotal?: number;
  NombreProducto?: string;
}

export interface CompraConDetalles extends Compra {
  detalles: CompraDetalle[];
}