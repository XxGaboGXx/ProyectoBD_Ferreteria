const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

/**
 * @route   POST /api/backups/create
 * @desc    Crear un nuevo backup
 * @access  Private
 */
router.post('/create', backupController.createBackup);

/**
 * @route   GET /api/backups/list
 * @desc    Listar todos los backups
 * @access  Private
 */
router.get('/list', backupController.listBackups);

/**
 * @route   GET /api/backups/info
 * @desc    Obtener información de backups
 * @access  Private
 */
router.get('/info', backupController.getBackupInfo);

/**
 * @route   POST /api/backups/restore
 * @desc    Restaurar un backup
 * @access  Private
 */
router.post('/restore', backupController.restoreBackup);

/**
 * @route   DELETE /api/backups/cleanup
 * @desc    Eliminar backups antiguos
 * @access  Private
 */
router.delete('/cleanup', backupController.deleteOldBackups);

/**
 * @route   DELETE /api/backups/:fileName
 * @desc    Eliminar un backup específico
 * @access  Private
 */
router.delete('/:fileName', backupController.deleteBackup);

module.exports = router;