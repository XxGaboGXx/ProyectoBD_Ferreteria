/**
 * Normaliza respuestas de API que pueden venir en diferentes formatos
 * @param response - Respuesta de la API (puede ser array, objeto con .data, etc.)
 * @returns Array normalizado
 */
export const normalizeArrayResponse = <T>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data) {
    return Array.isArray(response.data) ? response.data : [];
  }
  return [];
};

/**
 * Extrae datos de una respuesta de API
 * @param response - Respuesta de la API
 * @returns Datos extraídos
 */
export const extractData = <T>(response: any): T => {
  if (response?.data?.data) {
    return response.data.data;
  }
  if (response?.data) {
    return response.data;
  }
  return response;
};

