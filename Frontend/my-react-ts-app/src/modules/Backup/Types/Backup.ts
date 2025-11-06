export interface Backup {
    fileName: string;
    created: string;
    sizeBytes: number;
    sizeFormatted: string;
    isAutomatic: boolean;
    valid?: boolean;
    size?: number;
    path?: string;
    modified?: string;
    age?: string;
}

export interface BackupInfo {
    count: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    oldest: Backup | null;
    newest: Backup | null;
    backups: Backup[];
    path?: string;
    sqlServerEdition?: string;
}

export interface BackupDetails {
    fileName: string;
    fullPath: string;
    exists: boolean;
    sizeBytes: number;
    sizeFormatted: string;
    created: string;
    modified: string;
}

export interface BackupVerification {
    fileName: string;
    exists: boolean;
    isValid: boolean;
    size: number;
    message: string;
    success: boolean;
    status?: string;
    verifiedAt?: string;
}

export interface CreateBackupRequest {
    backupName?: string;
}

export interface RestoreBackupRequest {
    fileName: string;
}