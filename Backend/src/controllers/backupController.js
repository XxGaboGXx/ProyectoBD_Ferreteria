const backupService = require('../services/backupService');
const { utils, constants } = require('../config');

/**
 * Crear un nuevo backup
 */
exports.createBackup = async (req, res, next) => {
    try {
        const { name } = req.body;
        const result = await backupService.createBackup(name);
        
        res.status(constants.HTTP_STATUS.CREATED).json(
            utils.successResponse(result, 'Backup creado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Listar todos los backups
 */
exports.listBackups = async (req, res, next) => {
    try {
        const backups = await backupService.listBackups();
        
        res.json(
            utils.successResponse({
                count: backups.length,
                backups
            }, 'Lista de backups obtenida exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener información detallada de backups
 */
exports.getBackupInfo = async (req, res, next) => {
    try {
        const info = await backupService.getBackupInfo();
        
        res.json(
            utils.successResponse(info, 'Información de backups obtenida')
        );
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
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'El nombre del archivo es requerido',
                    code: 'FILENAME_REQUIRED'
                }
            });
        }
        
        const result = await backupService.restoreBackup(fileName);
        
        res.json(
            utils.successResponse(result, 'Backup restaurado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar backups antiguos
 */
exports.deleteOldBackups = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const result = await backupService.deleteOldBackups(days);
        
        res.json(
            utils.successResponse(result, 
                result.deleted > 0 
                    ? `${result.deleted} backup(s) eliminado(s)` 
                    : 'No hay backups antiguos para eliminar'
            )
        );
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
        
        res.json(
            utils.successResponse(result, 'Backup eliminado exitosamente')
        );
    } catch (error) {
        next(error);
    }
};