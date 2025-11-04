
// src/modules/Producto/Services/productoService.ts
import axios from 'axios';

// Importa el tipo Producto
import type { Producto } from '../Types/Producto';

// URL base de tu API
const API_URL = '/api/productos';

// Obtener todos los productos
export const fetchProductos = async (): Promise<Producto[]> => {
  const response = await axios.get<Producto[]>(API_URL);
  return response.data;
};

// Crear un nuevo producto
export const createProducto = async (data: Omit<Producto, 'Id_Producto'>): Promise<Producto> => {
  const response = await axios.post<Producto>(API_URL, data);
  return response.data;
};

// Actualizar un producto
export const updateProducto = async (id: number, data: Partial<Producto>): Promise<Producto> => {
  const response = await axios.put<Producto>(`${API_URL}/${id}`, data);
  return response.data;
};

// Obtener un producto por ID
export const fetchProductoById = async (id: number): Promise<Producto> => {
  const response = await axios.get<Producto>(`${API_URL}/${id}`);
  return response.data;
};