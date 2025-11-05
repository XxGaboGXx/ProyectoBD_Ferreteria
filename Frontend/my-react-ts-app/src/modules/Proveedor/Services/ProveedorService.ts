// src/modules/Proveedor/Services/proveedorService.ts
import axios from 'axios';

// Importa el tipo Proveedor
import type { Proveedor } from '../Types/Proveedor';

// URL base de tu API
const API_URL = '/api/proveedores';

// Obtener todos los proveedores
export const fetchProveedores = async (): Promise<Proveedor[]> => {
  const response = await axios.get<Proveedor[]>(API_URL);
  return response.data;
};

// Crear un nuevo proveedor
export const createProveedor = async (data: Omit<Proveedor, 'Id_proveedor'>): Promise<Proveedor> => {
  const response = await axios.post<Proveedor>(API_URL, data);
  return response.data;
};

// Actualizar un proveedor
export const updateProveedor = async (id: number, data: Partial<Proveedor>): Promise<Proveedor> => {
  const response = await axios.put<Proveedor>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener un proveedor por ID
export const fetchProveedorById = async (id: number): Promise<Proveedor> => {
  const response = await axios.get<Proveedor>(`${API_URL}/${id}`);
  return response.data;
};

// Eliminar un proveedor
export const deleteProveedor = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};