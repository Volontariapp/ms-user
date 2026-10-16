import { AppConfigService } from '../../../../config/app-config.service.js';
import { CustomConfig } from '../../../../config/base-config.js';
import { LoggerFormat } from '@volontariapp/config';

export const createMockAppConfigService = (msStorageUrl = 'localhost:5006'): AppConfigService => {
  const config = new CustomConfig();
  config.microServices = {
    msUserUrl: 'localhost:5001',
    msPostUrl: 'localhost:5002',
    msEventUrl: 'localhost:5003',
    msSocialUrl: 'localhost:5004',
    msWsUrl: 'localhost:5005',
    msStorageUrl,
  };
  config.db = {
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'ms_user',
    maxPoolSize: 10,
    ssl: false,
  };
  config.logger = { level: 'info', format: LoggerFormat.TEXT };
  config.auth = {
    internalPublicKeyPath: '',
    accessTokenPrivateKeyPath: '',
    refreshTokenPrivateKeyPath: '',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };
  config.port = 3001;
  config.emailEncryptionSecret = 'secret';
  return new AppConfigService(config);
};
