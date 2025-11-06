import { useState, useEffect } from 'react';
import { 
    RiAddLine, 
    RiDeleteBin6Line, 
    RiRefreshLine, 
    RiCheckboxCircleLine,
    RiUploadLine,
    RiSave3Line
} from 'react-icons/ri';
import backupService from '../Services/backupService';
import type { Backup, BackupInfo } from '../Types/Backup';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/ConfirmDialog';
import InputDialog from '../../../components/InputDialog';

const ListaBackup = () => {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [backupName, setBackupName] = useState('');
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
    const { showToast } = useToast();

    // ✅ ESTADOS PARA MODALES
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; fileName: string }>({ 
        isOpen: false, 
        fileName: '' 
    });
    const [restoreDialog, setRestoreDialog] = useState<{ isOpen: boolean; fileName: string }>({ 
        isOpen: false, 
        fileName: '' 
    });
    const [confirmRestoreDialog, setConfirmRestoreDialog] = useState<{ isOpen: boolean; fileName: string }>({ 
        isOpen: false, 
        fileName: '' 
    });
    const [oldBackupsDialog, setOldBackupsDialog] = useState<{ isOpen: boolean; days: number }>({ 
        isOpen: false, 
        days: 30 
    });
    const [inputDaysDialog, setInputDaysDialog] = useState(false);

    useEffect(() => {
        loadBackups();
        loadBackupInfo();
    }, []);

    const loadBackups = async () => {
        try {
            setLoading(true);
            const data = await backupService.listBackups();
            setBackups(data);
        } catch (error: any) {
            showToast('Error al cargar backups', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadBackupInfo = async () => {
        try {
            const data = await backupService.getBackupInfo();
            setBackupInfo(data);
        } catch (error: any) {
            console.error('Error al cargar info de backups:', error);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            
            const payload = backupName.trim() 
                ? { backupName: backupName.trim() } 
                : {};
            
            const result = await backupService.createBackup(payload);
            
            showToast(
                `🎉 Backup creado exitosamente: ${result.fileName} (${result.sizeFormatted})`,
                'success'
            );
            
            setBackupName('');
            await loadBackups();
            await loadBackupInfo();
        } catch (error: any) {
            console.error('❌ Error completo:', error);
            showToast(
                error.response?.data?.message || 'Error al crear backup',
                'error'
            );
        } finally {
            setCreating(false);
        }
    };

    // ✅ NUEVO: Abrir modal de restauración
    const handleRestoreBackup = (fileName: string) => {
        setRestoreDialog({ isOpen: true, fileName });
    };

    // ✅ NUEVO: Confirmar y abrir segundo modal para input
    const confirmRestore = (fileName: string) => {
        setRestoreDialog({ isOpen: false, fileName: '' });
        setConfirmRestoreDialog({ isOpen: true, fileName });
    };

    // ✅ NUEVO: Ejecutar restauración
    const executeRestore = async (fileName: string) => {
        try {
            setRestoring(true);
            setSelectedBackup(fileName);
            
            showToast('🔄 Restaurando backup... Esto puede tardar varios minutos.', 'info');
            
            await backupService.restoreBackup({ fileName });
            
            showToast(
                `✨ ¡Restauración completada! El backup "${fileName}" se ha restaurado correctamente. La página se recargará en 3 segundos...`,
                'success'
            );
            
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            
        } catch (error: any) {
            console.error('❌ Error al restaurar:', error);
            showToast(
                `❌ Error al restaurar backup: ${error.response?.data?.message || error.message}`,
                'error'
            );
        } finally {
            setRestoring(false);
            setSelectedBackup(null);
        }
    };

    // ✅ MODIFICADO: Usar modal en lugar de confirm
    const handleDeleteBackup = async (fileName: string) => {
        try {
            await backupService.deleteBackup(fileName);
            
            showToast(`🗑️ Backup "${fileName}" eliminado correctamente`, 'success');
            
            await loadBackups();
            await loadBackupInfo();
        } catch (error: any) {
            showToast(
                `❌ Error al eliminar backup: ${error.response?.data?.message || error.message}`,
                'error'
            );
        }
    };

    // ✅ MODIFICADO: Usar modales en lugar de prompt/confirm
    const handleDeleteOldBackups = async (days: number) => {
        try {
            const result = await backupService.deleteOldBackups(days);
            
            const message = result.deleted > 0 
                ? `🧹 Se eliminaron ${result.deleted} backup${result.deleted > 1 ? 's' : ''} antiguo${result.deleted > 1 ? 's' : ''}`
                : '✓ No se encontraron backups antiguos para eliminar';
            
            showToast(message, 'success');
            
            await loadBackups();
            await loadBackupInfo();
        } catch (error: any) {
            showToast('❌ Error al limpiar backups antiguos', 'error');
        }
    };

    const handleVerifyBackup = async (fileName: string) => {
        try {
            setSelectedBackup(fileName);
            const result = await backupService.verifyBackup(fileName);
            
            if (result.isValid) {
                showToast(
                    `✓ Backup "${fileName}" verificado correctamente y listo para restaurar`,
                    'success'
                );
            } else {
                showToast(`❌ Backup corrupto: ${result.message}`, 'error');
            }
            
            setSelectedBackup(null);
        } catch (error: any) {
            setSelectedBackup(null);
            showToast('❌ Error al verificar backup', 'error');
        }
    };

    return (
        <div className="p-6">
            {/* ✅ MODALES */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, fileName: '' })}
                onConfirm={() => handleDeleteBackup(deleteDialog.fileName)}
                title="Eliminar Backup"
                message={`¿Está seguro de eliminar el backup "${deleteDialog.fileName}"?\n\nEsta acción no se puede deshacer.`}
                type="danger"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <ConfirmDialog
                isOpen={restoreDialog.isOpen}
                onClose={() => setRestoreDialog({ isOpen: false, fileName: '' })}
                onConfirm={() => confirmRestore(restoreDialog.fileName)}
                title="⚠️ Advertencia Importante"
                message={`¿Está seguro de restaurar el backup "${restoreDialog.fileName}"?\n\nEsta acción:\n• Sobrescribirá TODOS los datos actuales\n• Cerrará todas las conexiones activas\n• Puede tardar varios minutos\n• Es IRREVERSIBLE\n\nSe recomienda crear un backup actual antes de continuar.`}
                type="warning"
                confirmText="Continuar"
                cancelText="Cancelar"
            />

            <InputDialog
                isOpen={confirmRestoreDialog.isOpen}
                onClose={() => setConfirmRestoreDialog({ isOpen: false, fileName: '' })}
                onConfirm={() => executeRestore(confirmRestoreDialog.fileName)}
                title="Confirmar Restauración"
                message="Para confirmar, escriba el nombre exacto del backup:"
                placeholder={confirmRestoreDialog.fileName}
                expectedValue={confirmRestoreDialog.fileName}
                confirmText="Restaurar"
                cancelText="Cancelar"
            />

            <InputDialog
                isOpen={inputDaysDialog}
                onClose={() => setInputDaysDialog(false)}
                onConfirm={(value) => {
                    const days = parseInt(value);
                    if (!isNaN(days) && days > 0) {
                        setOldBackupsDialog({ isOpen: true, days });
                    } else {
                        showToast('⚠️ Por favor ingrese un número válido de días', 'warning');
                    }
                }}
                title="Limpiar Backups Antiguos"
                message="¿Cuántos días de antigüedad desea conservar?"
                placeholder="30"
                confirmText="Continuar"
                cancelText="Cancelar"
            />

            <ConfirmDialog
                isOpen={oldBackupsDialog.isOpen}
                onClose={() => setOldBackupsDialog({ isOpen: false, days: 30 })}
                onConfirm={() => handleDeleteOldBackups(oldBackupsDialog.days)}
                title="Confirmar Limpieza"
                message={`Se eliminarán todos los backups con más de ${oldBackupsDialog.days} días.\n\n¿Desea continuar?`}
                type="warning"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            {/* Contenido principal */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Backups</h1>
                <p className="text-gray-600">Administre los backups de la base de datos</p>
            </div>

            {/* Estadísticas */}
            {backupInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Backups</p>
                                <p className="text-3xl font-bold text-blue-900">{backupInfo.count}</p>
                            </div>
                            <RiSave3Line className="text-4xl text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Tamaño Total</p>
                                <p className="text-3xl font-bold text-green-900">{backupInfo.totalSizeFormatted}</p>
                            </div>
                            <RiUploadLine className="text-4xl text-green-500" />
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Más Reciente</p>
                                <p className="text-lg font-semibold text-purple-900 truncate">
                                    {backupInfo.newest?.fileName.substring(0, 20) || 'N/A'}...
                                </p>
                            </div>
                            <RiCheckboxCircleLine className="text-4xl text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Crear Nuevo Backup */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Crear Nuevo Backup</h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={backupName}
                        onChange={(e) => setBackupName(e.target.value)}
                        placeholder="Nombre del backup (opcional)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={creating}
                    />
                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {creating ? (
                            <>
                                <RiRefreshLine className="animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <RiAddLine />
                                Crear Backup
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setInputDaysDialog(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RiDeleteBin6Line />
                        Limpiar Antiguos
                    </button>
                </div>
            </div>

            {/* Lista de Backups */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Backups Disponibles ({backups.length})
                        </h2>
                        <button
                            onClick={() => { loadBackups(); loadBackupInfo(); }}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <RiRefreshLine className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600">Cargando backups...</p>
                    </div>
                ) : backups.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No hay backups disponibles</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Archivo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha Creación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tamaño
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {backups.map((backup) => (
                                <tr key={backup.fileName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{backup.fileName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(backup.created).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{backup.sizeFormatted}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            backup.isAutomatic 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {backup.isAutomatic ? 'Automático' : 'Manual'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleVerifyBackup(backup.fileName)}
                                                disabled={selectedBackup === backup.fileName}
                                                className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                                                title="Verificar"
                                            >
                                                <RiCheckboxCircleLine className="text-xl" />
                                            </button>
                                            <button
                                                onClick={() => handleRestoreBackup(backup.fileName)}
                                                disabled={restoring}
                                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                                                title="Restaurar"
                                            >
                                                <RiUploadLine className="text-xl" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteDialog({ isOpen: true, fileName: backup.fileName })}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar"
                                            >
                                                <RiDeleteBin6Line className="text-xl" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ListaBackup;