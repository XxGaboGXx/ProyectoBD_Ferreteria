import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tipo extendido para incluir contador de reintentos
interface RetryConfig extends AxiosRequestConfig {
    _retryCount?: number;
}

const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Interceptor de peticiones
    client.interceptors.request.use(
        (config) => {
            console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Interceptor de respuestas con reintentos automáticos
    client.interceptors.response.use(
        (response) => {
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
            return response;
        },
        async (error: AxiosError) => {
            const config = error.config as RetryConfig;

            if (!config) {
                return Promise.reject(error);
            }

            config._retryCount = config._retryCount || 0;

            // MANEJO ERROR 429 - Rate Limit
            if (error.response?.status === 429 && config._retryCount < 3) {
                config._retryCount++;
                const delay = 2000 * Math.pow(2, config._retryCount - 1); // Backoff exponencial: 2s, 4s, 8s

                console.warn(`⚠️ Rate limit (429) - Reintento ${config._retryCount}/3 en ${delay}ms`);

                await new Promise(resolve => setTimeout(resolve, delay));
                return client.request(config);
            }

            // MANEJO ERRORES DE RED
            if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
                if (config._retryCount < 2) {
                    config._retryCount++;
                    console.warn(`⚠️ Error de red - Reintento ${config._retryCount}/2`);
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return client.request(config);
                }
            }

            console.error(`❌ ${config.method?.toUpperCase()} ${config.url}`, {
                status: error.response?.status,
                message: error.message
            });

            return Promise.reject(error);
        }
    );

    return client;
};

const api = createApiClient();
export default api;

// ============================================
// SISTEMA DE CACHÉ INTELIGENTE
// ============================================
interface CacheEntry {
    data: any;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 segundos por defecto

export const getCached = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL
): Promise<T> => {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
        console.log(`📦 Cache HIT: ${key}`);
        return cached.data as T;
    }

    console.log(`🔍 Cache MISS: ${key} - Obteniendo datos...`);
    const data = await fetcher();
    cache.set(key, { data, timestamp: now });

    return data;
};

// Limpiar caché antiguo cada 5 minutos
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            cache.delete(key);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Caché limpiado: ${cleaned} entradas eliminadas`);
    }
}, 5 * 60 * 1000);

// Función para limpiar caché manualmente
export const clearCache = (pattern?: string) => {
    if (!pattern) {
        cache.clear();
        console.log('🧹 Caché completamente limpiado');
        return;
    }

    let cleared = 0;
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
            cleared++;
        }
    }
    
    console.log(`🧹 Caché limpiado: ${cleared} entradas con patrón "${pattern}"`);
};