import { StorageClientService } from './storage.client.js';

export const createMockStorageClientService = (): jest.Mocked<Partial<StorageClientService>> => ({
  verifyFilesExist: jest.fn().mockResolvedValue(undefined),
});
