/**
 * Extrae mensaje de error de una respuesta de API
 */
export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado';
};

/**
 * Maneja errores de forma consistente
 */
export const handleApiError = (error: any, defaultMessage: string = 'Error al procesar la solicitud'): string => {
  console.error('❌ API Error:', error);
  return getErrorMessage(error) || defaultMessage;
};

