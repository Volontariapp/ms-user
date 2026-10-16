import {
  type ConfirmFileAttachmentResponse,
  type FileMetadata,
  EntityType,
  FileStatus,
  ScanStatus,
} from '@volontariapp/storage-client';
import { ValidationMode } from '@volontariapp/contracts-nest';

export class ConfirmFileAttachmentFactory {
  static createFileMetadata(overrides?: Partial<FileMetadata>): FileMetadata {
    return {
      id: overrides?.id ?? '123e4567-e89b-12d3-a456-426614174000',
      ownerId: overrides?.ownerId ?? '123e4567-e89b-12d3-a456-426614174000',
      objectKey: overrides?.objectKey ?? 'quarantine/123e4567-e89b-12d3-a456-426614174000',
      mimeType: overrides?.mimeType ?? 'image/webp',
      status: overrides?.status ?? FileStatus.FILE_STATUS_ATTACHED,
      entityType: overrides?.entityType ?? EntityType.ENTITY_TYPE_USER_AVATAR,
      entityId: overrides?.entityId ?? '123e4567-e89b-12d3-a456-426614174000',
      isPublic: overrides?.isPublic ?? true,
      uploadExpiresAt: overrides?.uploadExpiresAt ?? undefined,
      createdAt: overrides?.createdAt ?? undefined,
      updatedAt: overrides?.updatedAt ?? undefined,
      scanStatus: overrides?.scanStatus ?? ScanStatus.SCAN_STATUS_CLEAN,
      rejectionReason: overrides?.rejectionReason,
      publicUrl: overrides?.publicUrl ?? 'http://localhost:9000/public/avatar.webp',
      validationMode: overrides?.validationMode ?? ValidationMode.VALIDATION_MODE_SYNC,
    };
  }

  static createResponse(files?: FileMetadata[]): ConfirmFileAttachmentResponse {
    const fileList = files ?? [ConfirmFileAttachmentFactory.createFileMetadata()];
    return {
      success: true,
      updatedCount: fileList.length,
      files: fileList,
    };
  }
}
