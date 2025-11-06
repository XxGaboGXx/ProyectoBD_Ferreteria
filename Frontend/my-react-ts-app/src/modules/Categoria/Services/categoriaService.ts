// src/modules/Categoria/Services/categoriaService.ts
import api from '../../../services/api';
import type { Categoria, CategoriaListResponse, CategoriaEstadisticas } from '../Types/Categoria';
import type { Producto } from '../../Producto/Types/Producto';

export const fetchCategorias = async (params?: { page?: number; limit?: number; nombre?: string }): Promise<CategoriaListResponse> => {
  const response = await api.get('/categorias', { params });
  return response.data.data as CategoriaListResponse;
};

export const fetchCategoriaById = async (id: number): Promise<Categoria> => {
  const response = await api.get(`/categorias/${id}`);
  return response.data.data as Categoria;
};

export const createCategoria = async (payload: { Nombre: string; Descripcion?: string | null }): Promise<Categoria> => {
  const response = await api.post('/categorias', payload);
  return response.data.data as Categoria;
};

export const updateCategoria = async (
  id: number,
  payload: { Nombre?: string; Descripcion?: string | null }
): Promise<Categoria> => {
  const response = await api.put(`/categorias/${id}`, payload);
  return response.data.data as Categoria;
};

export const deleteCategoria = async (id: number): Promise<void> => {
  await api.delete(`/categorias/${id}`);
};

export interface ProductosCategoriaResponse {
  data: Producto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchProductosCategoria = async (
  id: number,
  params?: { page?: number; limit?: number; nombre?: string; stockBajo?: boolean }
): Promise<ProductosCategoriaResponse> => {
  const response = await api.get(`/categorias/${id}/productos`, { params: { ...params, stockBajo: params?.stockBajo?.toString() } });
  return response.data.data as ProductosCategoriaResponse;
};

export const fetchEstadisticasCategoria = async (id: number): Promise<CategoriaEstadisticas> => {
  const response = await api.get(`/categorias/${id}/estadisticas`);
  return response.data.data as CategoriaEstadisticas;
};
