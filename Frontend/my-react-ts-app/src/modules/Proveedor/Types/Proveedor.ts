
// src/modules/Proveedor/Types/Proveedor.ts
export interface Proveedor {
  Id_proveedor: number;
  Nombre: string;
  Telefono: string | null;
  Direccion: string | null;
  Correo_electronico: string | null;
}