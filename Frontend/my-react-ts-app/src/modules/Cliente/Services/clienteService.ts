// src/modules/Cliente/Services/clienteService.ts
import axios from 'axios';

// Importa el tipo Cliente
import type { Cliente } from '../Types/Cliente';

// URL base de tu API
const API_URL = '/api/clientes';

// Obtener todos los clientes
export const fetchClientes = async (): Promise<Cliente[]> => {
  const response = await axios.get<Cliente[]>(API_URL);
  return response.data;
};

// Crear un nuevo cliente
export const createCliente = async (data: Omit<Cliente, 'Id_cliente'>): Promise<Cliente> => {
  const response = await axios.post<Cliente>(API_URL, data);
  return response.data;
};

// Actualizar un cliente
export const updateCliente = async (id: number, data: Partial<Cliente>): Promise<Cliente> => {
  const response = await axios.put<Cliente>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener un cliente por ID
export const fetchClienteById = async (id: number): Promise<Cliente> => {
  const response = await axios.get<Cliente>(`${API_URL}/${id}`);
  return response.data;
};