import api from '../../../services/api';

// Tipados de respuestas (según backend)
export interface ReporteVentasResponse {
  periodo: { inicio: string; fin: string };
  resumen: any; // estructura definida por SP; mostramos como totales
  ventas: Array<{ Fecha?: string; Total?: number; CantidadVentas?: number; [k: string]: any }>;
}

export interface ReporteComprasResponse {
  periodo: { inicio: string; fin: string };
  resumen: any;
  compras: Array<{ Fecha?: string; Total?: number; CantidadCompras?: number; [k: string]: any }>;
}

export interface ReporteInventarioResponse {
  resumen: any;
  productos: Array<{ Id_producto: number; Nombre: string; CantidadActual: number; CantidadMinima: number; [k: string]: any }>;
}

export interface ReporteAlquileresResponse {
  periodo: { inicio: string; fin: string };
  resumen: any;
  alquileres: any[];
}

// Ventas
export const fetchReporteVentas = async (params: { fechaInicio: string; fechaFin: string }): Promise<ReporteVentasResponse> => {
  const response = await api.get('/reportes/ventas', { params });
  return response.data.data as ReporteVentasResponse;
};

// Compras
export const fetchReporteCompras = async (params: { fechaInicio: string; fechaFin: string }): Promise<ReporteComprasResponse> => {
  const response = await api.get('/reportes/compras', { params });
  return response.data.data as ReporteComprasResponse;
};

// Inventario
export const fetchReporteInventario = async (): Promise<ReporteInventarioResponse> => {
  const response = await api.get('/reportes/inventario');
  return response.data.data as ReporteInventarioResponse;
};

// Alquileres
export const fetchReporteAlquileres = async (params: { fechaInicio: string; fechaFin: string }): Promise<ReporteAlquileresResponse> => {
  const response = await api.get('/reportes/alquileres', { params });
  return response.data.data as ReporteAlquileresResponse;
};

// Clientes
export const fetchReporteClientes = async (): Promise<{ totalClientes: number; clientes: any[] }> => {
  const response = await api.get('/reportes/clientes');
  return response.data.data as { totalClientes: number; clientes: any[] };
};

// Productos más vendidos
export const fetchReporteProductosMasVendidos = async (params: { fechaInicio: string; fechaFin: string; limit?: number }): Promise<any[]> => {
  const response = await api.get('/reportes/productos-mas-vendidos', { params });
  return response.data.data as any[];
};

// Nota: el backend no expone exportación a PDF/Excel en /reportes/:tipo/export; si se agrega, implementamos aquí.