
// src/modules/Venta/Services/ventaService.ts
import axios from 'axios';

// Importa el tipo Venta
import type { Venta } from '../Types/Venta';

// URL base de tu API
const API_URL = '/api/ventas';

// Obtener todas las ventas
export const fetchVentas = async (): Promise<Venta[]> => {
  const response = await axios.get<Venta[]>(API_URL);
  return response.data;
};

// Crear una nueva venta
export const createVenta = async (data: Omit<Venta, 'Id_venta'>): Promise<Venta> => {
  const response = await axios.post<Venta>(API_URL, data);
  return response.data;
};

// Actualizar una venta
export const updateVenta = async (id: number, data: Partial<Venta>): Promise<Venta> => {
  const response = await axios.put<Venta>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener una venta por ID
export const fetchVentaById = async (id: number): Promise<Venta> => {
  const response = await axios.get<Venta>(`${API_URL}/${id}`);
  return response.data;
};