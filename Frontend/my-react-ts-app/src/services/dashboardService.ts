import api from './api';

// Obtener resumen general del dashboard
export const fetchDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    throw error;
  }
};

// Obtener ventas por día (últimos N días)
export const fetchVentasPorDia = async (days: number = 30) => {
  try {
    const response = await api.get('/dashboard/ventas-por-dia', { params: { days } });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    throw error;
  }
};

// Obtener top clientes
export const fetchTopClientes = async (limit: number = 10) => {
  try {
    const response = await api.get('/dashboard/top-clientes', { params: { limit } });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    throw error;
  }
};

// Obtener top productos más vendidos
export const fetchTopProductos = async (limit: number = 10) => {
  try {
    const response = await api.get('/dashboard/top-productos', { params: { limit } });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    throw error;
  }
};

// Obtener alertas del sistema
export const fetchAlertas = async () => {
  try {
    const response = await api.get('/dashboard/alertas');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    throw error;
  }
};

// Obtener ventas por categoría
export const fetchVentasPorCategoria = async () => {
  try {
    const response = await api.get('/dashboard/ventas-por-categoria');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas por categoría:', error);
    throw error;
  }
};

// Obtener estadísticas de alquileres
export const fetchEstadisticasAlquileres = async () => {
  try {
    const response = await api.get('/dashboard/alquileres-stats');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de alquileres:', error);
    throw error;
  }
};