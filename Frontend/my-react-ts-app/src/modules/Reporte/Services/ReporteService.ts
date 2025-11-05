import api from '../../../services/api';

// Obtener reporte de ventas
export const fetchReporteVentas = async (params: { fechaInicio: string; fechaFin: string }) => {
  try {
    const response = await api.get('/reportes/ventas', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    throw error;
  }
};

// Obtener reporte de compras
export const fetchReporteCompras = async (params: { fechaInicio: string; fechaFin: string }) => {
  try {
    const response = await api.get('/reportes/compras', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de compras:', error);
    throw error;
  }
};

// Obtener reporte de inventario
export const fetchReporteInventario = async () => {
  try {
    const response = await api.get('/reportes/inventario');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de inventario:', error);
    throw error;
  }
};

// Obtener reporte de alquileres
export const fetchReporteAlquileres = async (params: { fechaInicio: string; fechaFin: string }) => {
  try {
    const response = await api.get('/reportes/alquileres', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de alquileres:', error);
    throw error;
  }
};

// Obtener reporte de clientes
export const fetchReporteClientes = async () => {
  try {
    const response = await api.get('/reportes/clientes');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de clientes:', error);
    throw error;
  }
};

// Obtener reporte de productos más vendidos
export const fetchReporteTopProductos = async (params?: { fechaInicio?: string; fechaFin?: string; limit?: number }) => {
  try {
    const response = await api.get('/reportes/top-productos', { params });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error al obtener reporte de top productos:', error);
    throw error;
  }
};

// Exportar reporte a PDF o Excel
export const exportReporte = async (tipo: string, formato: 'pdf' | 'excel', params?: any) => {
  try {
    const response = await api.get(`/reportes/${tipo}/export`, {
      params: { ...params, formato },
      responseType: 'blob', // Para descargar archivos
    });
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-${tipo}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  } catch (error) {
    console.error(`Error al exportar reporte ${tipo}:`, error);
    throw error;
  }
};