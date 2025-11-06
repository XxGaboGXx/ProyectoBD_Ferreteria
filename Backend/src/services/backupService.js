const { getConnection, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { config } = require('../config');

class BackupService {
    constructor() {
        this.sqlServerBackupPath = config.backup?.path || 'C:\\Backups\\FerreteriaCentral';
        this.ensureBackupDirectory();
    }

    /**
     * Asegura que el directorio de backups existe
     */
    ensureBackupDirectory() {
        try {
            if (!fs.existsSync(this.sqlServerBackupPath)) {
                fs.mkdirSync(this.sqlServerBackupPath, { recursive: true });
                console.log(`✅ Directorio de backups creado: ${this.sqlServerBackupPath}`);
            }
        } catch (error) {
            console.error('❌ Error al crear directorio de backups:', error.message);
        }
    }

    /**
     * Formatea bytes a formato legible
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        if (!bytes) return 'N/A';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Crea un backup de la base de datos usando SP
     */
    async createBackup(backupName = null) {
        try {
            console.log('💾 ==================== BACKUP SERVICE ====================');
            console.log('💾 Parámetro recibido:', backupName);
            
            const pool = await getConnection();
            const dbName = config.database.database;
            
            // Generar timestamp
            const timestamp = new Date().toISOString()
                .replace(/:/g, '-')
                .replace(/\./g, '-')
                .slice(0, -5);
            
            // Generar nombre del archivo
            let fileName;
            if (backupName && backupName.trim()) {
                fileName = `${backupName.trim()}_${timestamp}.bak`;
                console.log('💾 Usando nombre PERSONALIZADO:', fileName);
            } else {
                fileName = `${dbName}_${timestamp}.bak`;
                console.log('💾 Usando nombre AUTOMÁTICO:', fileName);
            }
            
            const fullPath = path.join(this.sqlServerBackupPath, fileName);
            
            console.log('💾 Ruta completa del backup:', fullPath);
            console.log('💾 Llamando a SP_CrearBackup...');
            
            // ✅ USAR STORED PROCEDURE
            const result = await pool.request()
                .input('RutaCompleta', sql.NVarChar(500), fullPath)
                .input('NombreArchivo', sql.NVarChar(200), fileName)
                .execute('SP_CrearBackup');
            
            const spResult = result.recordset[0];
            
            if (!spResult.Success) {
                throw new Error(spResult.Mensaje);
            }
            
            console.log('✅ SP ejecutado exitosamente');
            
            // Verificar que el archivo existe
            let fileSize = 0;
            let fileExists = false;
            
            try {
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    fileSize = stats.size;
                    fileExists = true;
                    console.log('✅ Archivo verificado en disco');
                    console.log('💾 Tamaño:', this.formatBytes(fileSize));
                } else {
                    console.warn('⚠️  Archivo NO encontrado en disco');
                }
            } catch (e) {
                console.warn('⚠️  Error al verificar archivo:', e.message);
            }
            
            const finalResult = {
                success: true,
                fileName,
                path: fullPath,
                size: fileSize,
                sizeFormatted: this.formatBytes(fileSize),
                date: new Date(),
                timestamp,
                isAutomatic: !backupName,
                exists: fileExists
            };
            
            console.log('💾 Resultado final:', JSON.stringify(finalResult, null, 2));
            console.log('💾 =========================================================');
            
            return finalResult;
        } catch (error) {
            console.error('❌ ==================== ERROR EN BACKUP ====================');
            console.error('❌ Mensaje:', error.message);
            console.error('❌ Stack:', error.stack);
            console.error('❌ ==========================================================');
            throw error;
        }
    }

    /**
     * Restaura un backup usando SP
     */
    async restoreBackup(backupFileName) {
    try {
        console.log('🔄 ==================== RESTAURAR BACKUP ====================');
        console.log('🔄 Archivo:', backupFileName);
        
        const backupPath = path.join(this.sqlServerBackupPath, backupFileName);

        if (!fs.existsSync(backupPath)) {
            throw new Error(`El archivo de backup no existe: ${backupFileName}`);
        }

        console.log('✅ Archivo encontrado:', backupPath);
        console.log('🔄 Llamando a SP_RestaurarBackup en master...');

        const pool = await getConnection();

        // ✅ IMPORTANTE: Ejecutar el SP que está en master
        // Cambiar el contexto a master antes de llamar al SP
        const result = await pool.request()
            .input('RutaCompleta', sql.NVarChar(500), backupPath)
            .query(`
                USE master;
                EXEC SP_RestaurarBackup @RutaCompleta;
            `);

        // El resultado estará en el segundo recordset (después del USE)
        const spResult = result.recordsets[result.recordsets.length - 1][0];

        if (!spResult || !spResult.Success) {
            throw new Error(spResult?.Mensaje || 'Error desconocido al restaurar');
        }

        console.log('✅ Backup restaurado exitosamente');
        console.log('🔄 ===========================================================');

        return {
            success: true,
            message: 'Backup restaurado exitosamente',
            fileName: backupFileName,
            restoredAt: new Date()
        };
    } catch (error) {
        console.error('❌ ==================== ERROR EN RESTORE ====================');
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Código:', error.code);
        console.error('❌ Detalles:', error);
        console.error('❌ ===========================================================');
        throw new Error(`Error al restaurar backup: ${error.message}`);
    }
}


    /**
     * Verifica la integridad de un backup usando SP
     */
    async verifyBackup(backupFileName) {
        try {
            const backupPath = path.join(this.sqlServerBackupPath, backupFileName);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`El archivo no existe: ${backupFileName}`);
            }

            const pool = await getConnection();
            
            // ✅ USAR STORED PROCEDURE
            const result = await pool.request()
                .input('RutaCompleta', sql.NVarChar(500), backupPath)
                .execute('SP_VerificarBackup');

            const spResult = result.recordset[0];

            console.log(`${spResult.IsValid ? '✅' : '❌'} Verificación de backup:`, backupFileName);

            return {
                success: spResult.Success === 1,
                isValid: spResult.IsValid === 1,
                fileName: backupFileName,
                message: spResult.Mensaje,
                exists: true,
                size: fs.statSync(backupPath).size
            };
        } catch (error) {
            console.error('❌ Error al verificar backup:', error.message);
            return {
                success: false,
                isValid: false,
                fileName: backupFileName,
                message: error.message,
                exists: fs.existsSync(path.join(this.sqlServerBackupPath, backupFileName))
            };
        }
    }

    /**
     * Lista todos los backups disponibles
     */
    async listBackups() {
        try {
            if (!fs.existsSync(this.sqlServerBackupPath)) {
                return [];
            }

            const files = fs.readdirSync(this.sqlServerBackupPath)
                .filter(file => file.endsWith('.bak'))
                .map(file => {
                    const filePath = path.join(this.sqlServerBackupPath, file);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        fileName: file,
                        path: filePath,
                        size: stats.size,
                        sizeFormatted: this.formatBytes(stats.size),
                        created: stats.birthtime,
                        modified: stats.mtime,
                        sizeBytes: stats.size,
                        isAutomatic: !file.includes('_') || file.startsWith('FerreteriaCentral_')
                    };
                })
                .sort((a, b) => b.created - a.created);

            console.log(`📋 Backups encontrados: ${files.length}`);
            return files;
        } catch (error) {
            console.error('❌ Error al listar backups:', error.message);
            throw error;
        }
    }

    /**
     * Calcula la antigüedad de un archivo
     */
    getFileAge(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `${diffDays} días`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
        return `${Math.floor(diffDays / 365)} años`;
    }

    /**
     * Elimina backups antiguos
     */
    async deleteOldBackups(daysToKeep = 30) {
        try {
            const files = await this.listBackups();
            const now = new Date();
            let deleted = 0;

            for (const file of files) {
                const ageInDays = Math.floor((now - new Date(file.created)) / (1000 * 60 * 60 * 24));
                
                if (ageInDays > daysToKeep) {
                    fs.unlinkSync(file.path);
                    deleted++;
                    console.log(`🗑️  Eliminado backup antiguo: ${file.fileName} (${ageInDays} días)`);
                }
            }

            return {
                success: true,
                deleted,
                message: `${deleted} backups eliminados (mayores a ${daysToKeep} días)`
            };
        } catch (error) {
            console.error('❌ Error al eliminar backups antiguos:', error.message);
            throw error;
        }
    }

    /**
     * Elimina un backup específico
     */
    async deleteBackup(fileName) {
        try {
            const filePath = path.join(this.sqlServerBackupPath, fileName);

            if (!fs.existsSync(filePath)) {
                throw new Error(`El archivo no existe: ${fileName}`);
            }

            fs.unlinkSync(filePath);
            console.log(`🗑️  Backup eliminado: ${fileName}`);

            return {
                success: true,
                message: 'Backup eliminado exitosamente',
                fileName
            };
        } catch (error) {
            console.error('❌ Error al eliminar backup:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene información del directorio de backups
     */
    async getBackupInfo() {
        try {
            const backups = await this.listBackups();
            
            const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
            
            return {
                count: backups.length,
                totalSizeBytes: totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                oldest: backups.length > 0 ? backups[backups.length - 1] : null,
                newest: backups.length > 0 ? backups[0] : null,
                backups
            };
        } catch (error) {
            console.error('❌ Error al obtener info de backups:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene información detallada de un backup
     */
    async getBackupDetails(backupFileName) {
        try {
            const filePath = path.join(this.sqlServerBackupPath, backupFileName);

            if (!fs.existsSync(filePath)) {
                throw new Error(`El archivo no existe: ${backupFileName}`);
            }

            const stats = fs.statSync(filePath);

            return {
                fileName: backupFileName,
                fullPath: filePath,
                exists: true,
                sizeBytes: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            console.error('❌ Error al obtener detalles del backup:', error.message);
            throw error;
        }
    }

    /**
     * Inicia el sistema de backups automáticos
     */
    startAutoBackup() {
        const interval = config.backup?.autoBackupInterval || 24 * 60 * 60 * 1000; // 24 horas por defecto
        
        this.autoBackupTimer = setInterval(async () => {
            try {
                console.log('⏰ Iniciando backup automático...');
                await this.createBackup();
            } catch (error) {
                console.error('❌ Error en backup automático:', error.message);
            }
        }, interval);

        console.log(`✅ Sistema de backups automáticos iniciado (cada ${interval / 1000 / 60 / 60} horas)`);
    }

    /**
     * Detiene el sistema de backups automáticos
     */
    stopAutoBackup() {
        if (this.autoBackupTimer) {
            clearInterval(this.autoBackupTimer);
            this.autoBackupTimer = null;
            console.log('🛑 Sistema de backups automáticos detenido');
        }
    }
}

// Exportar como singleton
module.exports = new BackupService();