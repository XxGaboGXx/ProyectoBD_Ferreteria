// src/modules/Colaborador/Types/Colaborador.ts
export interface Colaborador {
  Id_colaborador: number;
  Nombre: string;
  Apellido1: string;
  Apellido2: string | null;
  Telefono: string | null;
  Direccion: string | null;
  CorreoElectronico: string | null;
}