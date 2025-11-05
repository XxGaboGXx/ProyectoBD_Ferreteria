// src/modules/Colaborador/Services/colaboradorService.ts
import axios from 'axios';

// Importa el tipo Colaborador
import type { Colaborador } from '../Types/Colaborador';

// URL base de tu API
const API_URL = '/api/colaboradores';

// Obtener todos los colaboradores
export const fetchColaboradores = async (): Promise<Colaborador[]> => {
  const response = await axios.get<Colaborador[]>(API_URL);
  return response.data;
};

// Crear un nuevo colaborador
export const createColaborador = async (data: Omit<Colaborador, 'Id_colaborador'>): Promise<Colaborador> => {
  const response = await axios.post<Colaborador>(API_URL, data);
  return response.data;
};

// Actualizar un colaborador
export const updateColaborador = async (id: number, data: Partial<Colaborador>): Promise<Colaborador> => {
  const response = await axios.put<Colaborador>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener un colaborador por ID
export const fetchColaboradorById = async (id: number): Promise<Colaborador> => {
  const response = await axios.get<Colaborador>(`${API_URL}/${id}`);
  return response.data;
};