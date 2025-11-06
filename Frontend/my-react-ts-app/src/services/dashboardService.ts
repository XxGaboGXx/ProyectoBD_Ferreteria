import api, { getCached } from './api';

// ============================================
// FUNCIONES CON CACHÉ PARA DASHBOARD
// ============================================

// Obtener resumen general del dashboard (con caché de 10 segundos)
export const fetchDashboardSummary = async () => {
  try {
    return await getCached(
      'dashboard-summary',
      async () => {
        const response = await api.get('/dashboard/summary');
        return response.data.data || response.data;
      },
      10000 // 10 segundos
    );
  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    throw error;
  }
};

// Obtener ventas por día (últimos N días) - SIN caché (datos en tiempo real)
export const fetchVentasPorDia = async (days: number = 30) => {
  try {
    const response = await api.get('/dashboard/ventas-por-dia', { params: { days } });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    throw error;
  }
};

// Obtener top clientes (con caché de 15 segundos)
export const fetchTopClientes = async (limit: number = 10) => {
  try {
    return await getCached(
      `dashboard-top-clientes-${limit}`,
      async () => {
        const response = await api.get('/dashboard/top-clientes', { params: { limit } });
        return response.data.data || response.data;
      },
      15000 // 15 segundos
    );
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    throw error;
  }
};

// Obtener top productos más vendidos (con caché de 15 segundos)
export const fetchTopProductos = async (limit: number = 10) => {
  try {
    return await getCached(
      `dashboard-top-productos-${limit}`,
      async () => {
        const response = await api.get('/dashboard/top-productos', { params: { limit } });
        return response.data.data || response.data;
      },
      15000 // 15 segundos
    );
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    throw error;
  }
};

// Obtener alertas del sistema (con caché de 20 segundos)
export const fetchAlertas = async () => {
  try {
    return await getCached(
      'dashboard-alertas',
      async () => {
        const response = await api.get('/dashboard/alertas');
        return response.data.data || response.data;
      },
      20000 // 20 segundos
    );
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    throw error;
  }
};

// Obtener ventas por categoría (con caché de 30 segundos)
export const fetchVentasPorCategoria = async () => {
  try {
    return await getCached(
      'dashboard-ventas-categoria',
      async () => {
        const response = await api.get('/dashboard/ventas-por-categoria');
        return response.data.data || response.data;
      },
      30000 // 30 segundos
    );
  } catch (error) {
    console.error('Error al obtener ventas por categoría:', error);
    throw error;
  }
};

// Obtener estadísticas de alquileres (con caché de 30 segundos)
export const fetchEstadisticasAlquileres = async () => {
  try {
    return await getCached(
      'dashboard-alquileres-stats',
      async () => {
        const response = await api.get('/dashboard/alquileres-stats');
        return response.data.data || response.data;
      },
      30000 // 30 segundos
    );
  } catch (error) {
    console.error('Error al obtener estadísticas de alquileres:', error);
    throw error;
  }
};