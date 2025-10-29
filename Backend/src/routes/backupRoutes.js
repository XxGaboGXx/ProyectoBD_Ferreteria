const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Crear backup
router.post('/create', backupController.createBackup);

// Listar backups
router.get('/list', backupController.listBackups);

// Obtener información de backups
router.get('/info', backupController.getBackupInfo);

// Restaurar backup
router.post('/restore', backupController.restoreBackup);

// Eliminar backups antiguos
router.delete('/cleanup', backupController.deleteOldBackups);

// Eliminar un backup específico
router.delete('/:fileName', backupController.deleteBackup);

module.exports = router;