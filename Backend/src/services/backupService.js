const { getConnection, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { config } = require('../config');

class BackupService {
    constructor() {
        this.backupPath = config.backup.path;
        this.ensureBackupDirectory();
    }

    /**
     * Asegura que el directorio de backups existe
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupPath)) {
            try {
                fs.mkdirSync(this.backupPath, { recursive: true });
                console.log(`✅ Directorio de backups creado: ${this.backupPath}`);
            } catch (error) {
                console.error(`❌ Error al crear directorio de backups: ${error.message}`);
                console.log(`⚠️  Intentando con ruta alternativa...`);
                this.backupPath = path.join(__dirname, '../../backups');
                fs.mkdirSync(this.backupPath, { recursive: true });
                console.log(`✅ Usando ruta alternativa: ${this.backupPath}`);
            }
        }
    }

    /**
     * Crea un backup de la base de datos usando el procedimiento almacenado dbo.sp_CreateBackup
     */
    async createBackup(backupName = null) {
        try {
            const pool = await getConnection();
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const fileName = backupName || `FerreteriaCentral_${timestamp}.bak`;
            const fullPath = path.join(this.backupPath, fileName);

            console.log('🔄 Iniciando backup de base de datos...');
            console.log(`📁 Destino: ${fullPath}`);

            // Llamar al procedimiento almacenado que realiza el BACKUP en el servidor SQL
            await pool.request()
                .input('backupFullPath', sql.NVarChar(4000), fullPath)
                .execute('dbo.sp_CreateBackup');

            // Verificar que el archivo fue creado en el filesystem (esto asume que SQL Server y la app acceden al mismo FS)
            const stats = fs.statSync(fullPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`✅ Backup creado exitosamente`);
            console.log(`   📄 Archivo: ${fileName}`);
            console.log(`   💾 Tamaño: ${sizeInMB} MB`);
            
            return {
                success: true,
                fileName,
                path: fullPath,
                size: stats.size,
                sizeFormatted: `${sizeInMB} MB`,
                date: new Date(),
                timestamp
            };
        } catch (error) {
            console.error('❌ Error al crear backup:', error.message);
            throw error;
        }
    }

    /**
     * Restaura un backup usando el procedimiento almacenado dbo.sp_RestoreBackup
     */
    async restoreBackup(backupFileName) {
        try {
            const pool = await getConnection();
            const fullPath = path.join(this.backupPath, backupFileName);

            if (!fs.existsSync(fullPath)) {
                throw new Error(`Archivo de backup no encontrado: ${backupFileName}`);
            }

            console.log('🔄 Restaurando backup...');

            // Ejecutar el SP que hace el ALTER DATABASE ... RESTORE ... y vuelve a MULTI_USER
            await pool.request()
                .input('backupFullPath', sql.NVarChar(4000), fullPath)
                .execute('dbo.sp_RestoreBackup');

            console.log('✅ Backup restaurado exitosamente');
            
            return { 
                success: true, 
                message: 'Backup restaurado exitosamente',
                fileName: backupFileName,
                restoredAt: new Date()
            };
        } catch (error) {
            console.error('❌ Error al restaurar backup:', error.message);
            
            // Intentar asegurar que la DB vuelva a multi_user si algo falló
            try {
                const pool = await getConnection();
                await pool.request().query(`
                    USE master;
                    ALTER DATABASE FerreteriaCentral SET MULTI_USER;
                `);
            } catch (e) {
                console.error('⚠️  No se pudo restaurar modo multi user:', e.message);
            }
            
            throw error;
        }
    }

    /**
     * Lista todos los backups disponibles (sin cambios, opera en filesystem)
     */
    async listBackups() {
        try {
            if (!fs.existsSync(this.backupPath)) {
                return [];
            }

            const files = fs.readdirSync(this.backupPath);
            const backups = files
                .filter(file => file.endsWith('.bak'))
                .map(file => {
                    const filePath = path.join(this.backupPath, file);
                    const stats = fs.statSync(filePath);
                    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                    
                    return {
                        fileName: file,
                        path: filePath,
                        size: stats.size,
                        sizeFormatted: `${sizeInMB} MB`,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        age: this.getFileAge(stats.birthtime)
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            console.error('❌ Error al listar backups:', error);
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
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return 'recién creado';
        }
    }

    /**
     * Elimina backups antiguos
     */
    async deleteOldBackups(daysToKeep = 30) {
        try {
            const files = fs.readdirSync(this.backupPath);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
            let deleted = 0;
            const deletedFiles = [];

            files.forEach(file => {
                if (!file.endsWith('.bak')) return;
                
                const filePath = path.join(this.backupPath, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.birthtime.getTime();

                if (age > maxAge) {
                    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                    fs.unlinkSync(filePath);
                    deleted++;
                    deletedFiles.push({
                        name: file,
                        size: `${sizeInMB} MB`,
                        age: this.getFileAge(stats.birthtime)
                    });
                    console.log(`🗑️  Backup antiguo eliminado: ${file}`);
                }
            });

            if (deleted > 0) {
                console.log(`✅ ${deleted} backup(s) antiguo(s) eliminado(s)`);
            }

            return { 
                success: true, 
                deleted,
                deletedFiles,
                daysToKeep
            };
        } catch (error) {
            console.error('❌ Error al eliminar backups antiguos:', error);
            throw error;
        }
    }

    /**
     * Elimina un backup específico
     */
    async deleteBackup(fileName) {
        try {
            const filePath = path.join(this.backupPath, fileName);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`Backup no encontrado: ${fileName}`);
            }

            const stats = fs.statSync(filePath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            fs.unlinkSync(filePath);
            
            console.log(`🗑️  Backup eliminado: ${fileName}`);
            
            return {
                success: true,
                message: 'Backup eliminado exitosamente',
                fileName,
                size: `${sizeInMB} MB`
            };
        } catch (error) {
            console.error('❌ Error al eliminar backup:', error);
            throw error;
        }
    }

    /**
     * Obtiene información del directorio de backups
     */
    async getBackupInfo() {
        try {
            const backups = await this.listBackups();
            
            const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
            const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            const totalSizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

            return {
                path: this.backupPath,
                count: backups.length,
                totalSize: totalSize,
                totalSizeFormatted: totalSizeInGB > 1 ? `${totalSizeInGB} GB` : `${totalSizeInMB} MB`,
                oldest: backups.length > 0 ? backups[backups.length - 1] : null,
                newest: backups.length > 0 ? backups[0] : null,
                backups: backups
            };
        } catch (error) {
            console.error('❌ Error al obtener información de backups:', error);
            throw error;
        }
    }

    /**
     * Inicia el sistema de backups automáticos
     */
    startAutoBackup() {
        if (!config.backup.enabled) {
            console.log('⚠️  Backups automáticos deshabilitados en configuración');
            return;
        }

        console.log('🔄 Iniciando sistema de backups automáticos...');
        console.log(`   📁 Ruta: ${this.backupPath}`);
        console.log(`   ⏰ Intervalo: ${config.backup.autoBackupInterval / (60 * 60 * 1000)} horas`);
        console.log(`   📅 Retención: ${config.backup.retention} días`);
        
        this.autoBackupInterval = setInterval(async () => {
            try {
                console.log('\n⏰ Ejecutando backup automático programado...');
                await this.createBackup();
                await this.deleteOldBackups(config.backup.retention);
            } catch (error) {
                console.error('❌ Error en backup automático:', error.message);
            }
        }, config.backup.autoBackupInterval);

        console.log(`✅ Sistema de backups automáticos iniciado`);
    }

    /**
     * Detiene el sistema de backups automáticos
     */
    stopAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
            console.log('🛑 Sistema de backups automáticos detenido');
        }
    }
}

// Exportar como singleton
module.exports = new BackupService();