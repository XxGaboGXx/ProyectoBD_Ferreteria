// src/modules/Alquiler/Services/alquilerService.ts
import axios from 'axios';

// Importa el tipo Alquiler
import type { Alquiler } from '../Types/Alquiler';

// URL base de tu API
const API_URL = '/api/alquileres';

// Obtener todos los alquileres
export const fetchAlquileres = async (): Promise<Alquiler[]> => {
  const response = await axios.get<Alquiler[]>(API_URL);
  return response.data;
};

// Crear un nuevo alquiler
export const createAlquiler = async (data: Omit<Alquiler, 'Id_alquiler'>): Promise<Alquiler> => {
  const response = await axios.post<Alquiler>(API_URL, data);
  return response.data;
};

// Actualizar un alquiler
export const updateAlquiler = async (id: number, data: Partial<Alquiler>): Promise<Alquiler> => {
  const response = await axios.put<Alquiler>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener un alquiler por ID
export const fetchAlquilerById = async (id: number): Promise<Alquiler> => {
  const response = await axios.get<Alquiler>(`${API_URL}/${id}`);
  return response.data;
};