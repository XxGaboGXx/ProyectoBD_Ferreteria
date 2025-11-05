// src/modules/Reporte/Services/reporteService.ts
import axios from 'axios';

export const fetchReporteVentas = async (fechaInicio: string, fechaFin: string) => {
  const response = await axios.get(`/api/reportes/ventas`, {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};

export const fetchReporteCompras = async (fechaInicio: string, fechaFin: string) => {
  const response = await axios.get(`/api/reportes/compras`, {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};

export const fetchStockBajo = async () => {
  const response = await axios.get('/api/reportes/stock-bajo');
  return response.data;
};