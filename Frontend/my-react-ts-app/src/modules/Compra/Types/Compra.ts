// src/modules/Compra/Types/Compra.ts
export interface Compra {
  Id_compra: number;
  FechaCompra: string; // DATETIME
  TotalCompra: number;
  NumeroFactura: string | null;
  Id_proveedor: number;
}