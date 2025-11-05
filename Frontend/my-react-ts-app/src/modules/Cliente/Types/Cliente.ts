// src/modules/Cliente/Types/Cliente.ts
export interface Cliente {
  Id_cliente: number;
  Nombre: string;
  Apellidos: string;
  Telefono: string | null;
  Direccion: string | null;
  Correo: string | null;
  TipoCliente: string; // 'Contado', 'Crédito', etc.
}