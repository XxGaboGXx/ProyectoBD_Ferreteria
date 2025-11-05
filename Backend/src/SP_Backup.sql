-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE BACKUPS
-- Base de Datos: FerreteriaCentral
-- Fecha: 2025-11-05
-- Total SPs: 4
-- =============================================

USE FerreteriaCentral;
GO

-- =============================================
-- SP 1: Crear Backup
-- Descripción: Crea un backup completo de la base de datos
-- Parámetros: 
--   @RutaCompleta: Ruta completa del archivo de backup (incluye nombre)
--   @NombreArchivo: Nombre del archivo de backup
-- Retorna: Información del backup creado (FileName, FullPath, CreatedAt, Status, Message)
-- Notas: 
--   - Compatible con SQL Server Express (sin compresión)
--   - Usa SQL dinámico para flexibilidad de rutas
--   - Retorna resultado estructurado para Node.js
-- =============================================
IF OBJECT_ID('SP_CrearBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_CrearBackup;
GO

CREATE PROCEDURE SP_CrearBackup
    @RutaCompleta NVARCHAR(500),
    @NombreArchivo NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        
        -- Crear backup sin compresión (SQL Server Express)
        SET @SQL = N'
            BACKUP DATABASE [FerreteriaCentral]
            TO DISK = N''' + @RutaCompleta + '''
            WITH FORMAT, 
            MEDIANAME = ''FerreteriaCentralBackup'',
            NAME = ''Full Backup of FerreteriaCentral'',
            STATS = 10;
        ';
        
        EXEC sp_executesql @SQL;
        
        -- Retornar información del backup
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            GETDATE() as CreatedAt,
            'SUCCESS' as Status,
            'Backup creado exitosamente' as Message;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            NULL as CreatedAt,
            'ERROR' as Status,
            @ErrorMessage as Message;
            
        RAISERROR(@ErrorMessage, @ErrorSeverity, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 2: Restaurar Backup
-- Descripción: Restaura la base de datos desde un archivo de backup
-- Parámetros: 
--   @RutaCompleta: Ruta completa del archivo de backup a restaurar
--   @NombreArchivo: Nombre del archivo de backup
-- Retorna: Información de la restauración (FileName, FullPath, RestoredAt, Status, Message)
-- Notas: 
--   - Pone la BD en modo SINGLE_USER temporalmente
--   - Usa REPLACE para sobrescribir BD existente
--   - Restaura en ubicaciones originales (sin MOVE)
--   - Asegura volver a MULTI_USER incluso en caso de error
-- =============================================
IF OBJECT_ID('SP_RestaurarBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_RestaurarBackup;
GO

CREATE PROCEDURE SP_RestaurarBackup
    @RutaCompleta NVARCHAR(500),
    @NombreArchivo NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Variables para construcción dinámica
        DECLARE @RestoreSQL NVARCHAR(MAX);
        
        -- Poner BD en modo single user
        ALTER DATABASE [FerreteriaCentral] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        
        BEGIN TRY
            -- Construir y ejecutar RESTORE sin MOVE (usar ubicaciones originales)
            SET @RestoreSQL = N'
                RESTORE DATABASE [FerreteriaCentral]
                FROM DISK = N''' + @RutaCompleta + '''
                WITH REPLACE, RECOVERY, STATS = 10;
            ';
            
            EXEC(@RestoreSQL);
            
            -- Volver a modo multi user
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
        END TRY
        BEGIN CATCH
            -- Volver a modo multi user en caso de error
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
            THROW;
        END CATCH
        
        -- Retornar información
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            GETDATE() as RestoredAt,
            'SUCCESS' as Status,
            'Backup restaurado exitosamente' as Message;
            
    END TRY
    BEGIN CATCH
        -- Intentar volver a modo multi user en caso de error
        BEGIN TRY
            ALTER DATABASE [FerreteriaCentral] SET MULTI_USER;
        END TRY
        BEGIN CATCH
            -- Ignorar error si ya está en multi user
        END CATCH
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        
        SELECT 
            @NombreArchivo as FileName,
            @RutaCompleta as FullPath,
            NULL as RestoredAt,
            'ERROR' as Status,
            @ErrorMessage as Message;
            
        RAISERROR(@ErrorMessage, @ErrorSeverity, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 3: Verificar Backup
-- Descripción: Verifica la integridad de un archivo de backup sin restaurarlo
-- Parámetros: 
--   @RutaCompleta: Ruta completa del archivo de backup a verificar
-- Retorna: Estado de verificación (FullPath, Status, Message, VerifiedAt)
-- Notas: 
--   - Usa RESTORE VERIFYONLY (no afecta la BD actual)
--   - Retorna VALID o INVALID con mensaje descriptivo
-- =============================================
IF OBJECT_ID('SP_VerificarBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_VerificarBackup;
GO

CREATE PROCEDURE SP_VerificarBackup
    @RutaCompleta NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        
        -- Verificar backup
        SET @SQL = N'
            RESTORE VERIFYONLY 
            FROM DISK = N''' + @RutaCompleta + '''
        ';
        
        EXEC sp_executesql @SQL;
        
        -- Si llega aquí, el backup es válido
        SELECT 
            @RutaCompleta as FullPath,
            'VALID' as Status,
            'Backup verificado correctamente' as Message,
            GETDATE() as VerifiedAt;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        
        SELECT 
            @RutaCompleta as FullPath,
            'INVALID' as Status,
            @ErrorMessage as Message,
            GETDATE() as VerifiedAt;
            
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP 4: Obtener Información de Backup
-- Descripción: Obtiene información detallada de un archivo de backup
-- Parámetros: 
--   @RutaCompleta: Ruta completa del archivo de backup
-- Retorna: Información del backup (DatabaseName, BackupPath, Size, FileCount)
-- Notas: 
--   - Usa RESTORE FILELISTONLY (más compatible con SQL Express)
--   - Crea tabla temporal para análisis
--   - Calcula tamaño total en Bytes y MB
--   - No afecta la BD actual
-- =============================================
IF OBJECT_ID('SP_ObtenerInfoBackup', 'P') IS NOT NULL
    DROP PROCEDURE SP_ObtenerInfoBackup;
GO

CREATE PROCEDURE SP_ObtenerInfoBackup
    @RutaCompleta NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @SQL NVARCHAR(MAX);
        DECLARE @DatabaseName NVARCHAR(128);
        DECLARE @BackupStartDate DATETIME;
        DECLARE @BackupFinishDate DATETIME;
        DECLARE @BackupSize BIGINT;
        DECLARE @BackupType SMALLINT;
        
        -- Obtener información usando RESTORE FILELISTONLY (más compatible)
        CREATE TABLE #FileListInfo (
            LogicalName NVARCHAR(128),
            PhysicalName NVARCHAR(260),
            Type CHAR(1),
            FileGroupName NVARCHAR(128),
            Size NUMERIC(20,0),
            MaxSize NUMERIC(20,0),
            FileID BIGINT,
            CreateLSN NUMERIC(25,0),
            DropLSN NUMERIC(25,0),
            UniqueID UNIQUEIDENTIFIER,
            ReadOnlyLSN NUMERIC(25,0),
            ReadWriteLSN NUMERIC(25,0),
            BackupSizeInBytes BIGINT,
            SourceBlockSize INT,
            FileGroupID INT,
            LogGroupGUID UNIQUEIDENTIFIER,
            DifferentialBaseLSN NUMERIC(25,0),
            DifferentialBaseGUID UNIQUEIDENTIFIER,
            IsReadOnly BIT,
            IsPresent BIT,
            TDEThumbprint VARBINARY(32),
            SnapshotUrl NVARCHAR(360)
        );
        
        SET @SQL = N'RESTORE FILELISTONLY FROM DISK = N''' + @RutaCompleta + '''';
        INSERT INTO #FileListInfo EXEC sp_executesql @SQL;
        
        -- Calcular tamaño total
        SELECT @BackupSize = SUM(BackupSizeInBytes) FROM #FileListInfo;
        
        -- Retornar información básica
        SELECT 
            'FerreteriaCentral' as DatabaseName,
            @RutaCompleta as BackupPath,
            @BackupSize as BackupSizeBytes,
            CAST(@BackupSize / 1024.0 / 1024.0 AS DECIMAL(10,2)) as BackupSizeMB,
            'Full Backup' as BackupType,
            COUNT(*) as FileCount
        FROM #FileListInfo;
        
        DROP TABLE #FileListInfo;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        
        -- Retornar error como resultado
        SELECT 
            'ERROR' as Status,
            @ErrorMessage as ErrorMessage,
            @RutaCompleta as BackupPath;
    END CATCH
END;
GO

-- =============================================
-- Verificación de creación de SPs
-- =============================================
PRINT '==========================================';
PRINT 'Stored Procedures de BACKUP creados:';
PRINT '==========================================';
SELECT 
    name AS 'Stored Procedure',
    create_date AS 'Fecha Creación'
FROM sys.procedures
WHERE name LIKE 'SP_%Backup%' OR name = 'SP_CrearBackup' OR name = 'SP_RestaurarBackup' OR name = 'SP_VerificarBackup' OR name = 'SP_ObtenerInfoBackup'
ORDER BY name;
PRINT '==========================================';
PRINT 'Total: 4 Stored Procedures';
PRINT '==========================================';
