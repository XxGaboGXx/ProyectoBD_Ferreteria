const backupService = require('../services/backupService');
const { utils, constants } = require('../config');

/**
 * Crear un nuevo backup
 */
exports.createBackup = async (req, res, next) => {
    try {
        const { backupName } = req.body;
        const result = await backupService.createBackup(backupName);
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