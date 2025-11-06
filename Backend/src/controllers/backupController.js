const backupService = require('../services/backupService');
const { utils, constants } = require('../config');

/**
 * Crear un nuevo backup
 */
exports.createBackup = async (req, res, next) => {
    try {
        console.log('📥 ==================== CREAR BACKUP ====================');
        console.log('📥 Body completo recibido:', JSON.stringify(req.body, null, 2));
        console.log('📥 Headers:', req.headers);
        
        const { backupName } = req.body;
        
        console.log('📝 backupName extraído:', backupName);
        console.log('📝 Tipo de backupName:', typeof backupName);
        
        // ✅ Validar y limpiar el nombre
        const finalName = backupName && typeof backupName === 'string' && backupName.trim() 
            ? backupName.trim() 
            : null;
        
        console.log('✅ Nombre final procesado:', finalName);
        console.log('🚀 Llamando a backupService.createBackup con:', finalName);
        
        const result = await backupService.createBackup(finalName);
        
        console.log('✅ Resultado del servicio:', JSON.stringify(result, null, 2));
        console.log('📥 =====================================================');
        
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Backup creado exitosamente')
        );
    } catch (error) {
        console.error('❌ Error en createBackup:', error);
        next(error);
    }
};

/**
 * Listar todos los backups
 */
exports.listBackups = async (req, res, next) => {
    try {
        const backups = await backupService.listBackups();
        res.json(utils.successResponse(backups));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener información de backups
 */
exports.getBackupInfo = async (req, res, next) => {
    try {
        const info = await backupService.getBackupInfo();
        res.json(utils.successResponse(info));
    } catch (error) {
        next(error);
    }
};

/**
 * Restaurar un backup
 */
exports.restoreBackup = async (req, res, next) => {
    try {
        const { fileName } = req.body;
        
        if (!fileName) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json(
                utils.errorResponse('El nombre del archivo es requerido')
            );
        }

        const result = await backupService.restoreBackup(fileName);
        res.json(utils.successResponse(result, 'Backup restaurado exitosamente'));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar backups antiguos
 */
exports.deleteOldBackups = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const result = await backupService.deleteOldBackups(parseInt(days));
        res.json(utils.successResponse(result, `Backups antiguos eliminados (>${days} días)`));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar un backup específico
 */
exports.deleteBackup = async (req, res, next) => {
    try {
        const { fileName } = req.params;
        const result = await backupService.deleteBackup(fileName);
        res.json(utils.successResponse(result, 'Backup eliminado exitosamente'));
    } catch (error) {
        next(error);
    }
};

/**
 * Verificar integridad de un backup
 */
exports.verifyBackup = async (req, res, next) => {
    try {
        const { fileName } = req.params;
        
        if (!fileName) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json(
                utils.errorResponse('El nombre del archivo es requerido')
            );
        }

        const result = await backupService.verifyBackup(fileName);
        res.json(utils.successResponse(result, 'Backup verificado'));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener detalles de un backup
 */
exports.getBackupDetails = async (req, res, next) => {
    try {
        const { fileName } = req.params;
        
        if (!fileName) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json(
                utils.errorResponse('El nombre del archivo es requerido')
            );
        }

        const result = await backupService.getBackupDetails(fileName);
        res.json(utils.successResponse(result, 'Detalles del backup obtenidos'));
    } catch (error) {
        next(error);
    }
};