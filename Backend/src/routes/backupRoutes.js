const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

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
 * @route   POST /api/backups/:fileName/verify
 * @desc    Verificar integridad de un backup
 * @access  Private
 */
router.post('/:fileName/verify', backupController.verifyBackup);

/**
 * @route   GET /api/backups/:fileName/details
 * @desc    Obtener detalles de un backup
 * @access  Private
 */
router.get('/:fileName/details', backupController.getBackupDetails);

/**
 * @route   DELETE /api/backups/old
 * @desc    Eliminar backups antiguos
 * @access  Private
 */
router.delete('/old', backupController.deleteOldBackups);

/**
 * @route   GET /api/backups
 * @desc    Listar todos los backups
 * @access  Private
 */
router.get('/', backupController.listBackups);

/**
 * @route   POST /api/backups
 * @desc    Crear un nuevo backup
 * @access  Private
 */
router.post('/', backupController.createBackup);

/**
 * @route   DELETE /api/backups/:fileName
 * @desc    Eliminar un backup específico
 * @access  Private
 */
router.delete('/:fileName', backupController.deleteBackup);

module.exports = router;