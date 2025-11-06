import api from '../../../services/api';
import type { 
    Backup, 
    BackupInfo, 
    BackupDetails, 
    BackupVerification,
    CreateBackupRequest,
    RestoreBackupRequest
} from '../Types/Backup';

const BACKUP_ENDPOINTS = {
    BASE: '/backups',
    INFO: '/backups/info',
    OLD: '/backups/old',
    RESTORE: '/backups/restore'
};

export const backupService = {
    /**
     * Crear un nuevo backup (puede tardar mucho)
     */
    async createBackup(data?: CreateBackupRequest): Promise<any> {
        console.log('🚀 Enviando petición de backup con:', data);
        const response = await api.post(BACKUP_ENDPOINTS.BASE, data || {}, {
            timeout: 300000 // 5 minutos
        });
        console.log('✅ Respuesta del servidor:', response.data);
        return response.data;
    },

    /**
     * Listar todos los backups
     */
    async listBackups(): Promise<Backup[]> {
        const response = await api.get(BACKUP_ENDPOINTS.BASE);
        return response.data.data;
    },

    /**
     * Obtener información de backups
     */
    async getBackupInfo(): Promise<BackupInfo> {
        const response = await api.get(BACKUP_ENDPOINTS.INFO);
        return response.data.data;
    },

    /**
     * Restaurar un backup (puede tardar MUCHO)
     */
    async restoreBackup(data: RestoreBackupRequest): Promise<any> {
        const response = await api.post(BACKUP_ENDPOINTS.RESTORE, data, {
            timeout: 600000 // 10 minutos
        });
        return response.data;
    },

    /**
     * Eliminar backups antiguos
     */
    async deleteOldBackups(days: number = 30): Promise<any> {
        const response = await api.delete(`${BACKUP_ENDPOINTS.OLD}?days=${days}`);
        return response.data;
    },

    /**
     * Eliminar un backup específico
     */
    async deleteBackup(fileName: string): Promise<any> {
        const response = await api.delete(`${BACKUP_ENDPOINTS.BASE}/${fileName}`);
        return response.data;
    },

    /**
     * Verificar integridad de un backup
     */
    async verifyBackup(fileName: string): Promise<BackupVerification> {
        const response = await api.post(`${BACKUP_ENDPOINTS.BASE}/${fileName}/verify`, {}, {
            timeout: 120000 // 2 minutos
        });
        return response.data.data;
    },

    /**
     * Obtener detalles de un backup
     */
    async getBackupDetails(fileName: string): Promise<BackupDetails> {
        const response = await api.get(`${BACKUP_ENDPOINTS.BASE}/${fileName}/details`);
        return response.data.data;
    }
};

export default backupService;