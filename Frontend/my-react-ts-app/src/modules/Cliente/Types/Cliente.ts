// src/modules/Cliente/Types/Cliente.ts
export interface Cliente {
  Id_cliente: number;
  Nombre: string;
  Apellido1: string | null;
  Apellido2: string | null;
  Telefono: string | null;
  Direccion: string | null;
  Correo: string | null;
}

export type NuevoCliente = Omit<Cliente, 'Id_cliente'>;