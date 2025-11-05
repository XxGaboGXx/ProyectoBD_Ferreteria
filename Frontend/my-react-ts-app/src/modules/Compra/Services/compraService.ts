// src/modules/Compra/Services/compraService.ts
import axios from 'axios';

// Importa el tipo Compra
import type { Compra } from '../Types/Compra';

// URL base de tu API
const API_URL = '/api/compras';

// Obtener todas las compras
export const fetchCompras = async (): Promise<Compra[]> => {
  const response = await axios.get<Compra[]>(API_URL);
  return response.data;
};

// Crear una nueva compra
export const createCompra = async (data: Omit<Compra, 'Id_compra'>): Promise<Compra> => {
  const response = await axios.post<Compra>(API_URL, data);
  return response.data;
};

// Actualizar una compra
export const updateCompra = async (id: number, data: Partial<Compra>): Promise<Compra> => {
  const response = await axios.put<Compra>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener una compra por ID
export const fetchCompraById = async (id: number): Promise<Compra> => {
  const response = await axios.get<Compra>(`${API_URL}/${id}`);
  return response.data;
};