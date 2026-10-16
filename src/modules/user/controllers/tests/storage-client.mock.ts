import { jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import type { StorageClientService } from '@volontariapp/storage-client';
import { ConfirmFileAttachmentFactory } from './confirm-file-attachment.factory.js';

export interface MockStorageClientService {
  confirmUserAvatarAttachment: Mock<StorageClientService['confirmUserAvatarAttachment']>;
  confirmFileAttachment: Mock<StorageClientService['confirmFileAttachment']>;
}

export const createMockStorageClientService = (): MockStorageClientService => ({
  confirmUserAvatarAttachment: jest
    .fn<StorageClientService['confirmUserAvatarAttachment']>()
    .mockResolvedValue(ConfirmFileAttachmentFactory.createResponse()),
  confirmFileAttachment: jest
    .fn<StorageClientService['confirmFileAttachment']>()
    .mockResolvedValue(ConfirmFileAttachmentFactory.createResponse()),
});
