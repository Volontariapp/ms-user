import { Type } from 'class-transformer';
import { IsDefined, IsString, ValidateNested } from 'class-validator';

import {
  BackendConfig,
  AuthGeneratorConfig,
  PostgresConfig,
  MSURLsConfig,
} from '@volontariapp/config';

export class ExtendedMSURLsConfig extends MSURLsConfig {
  @IsString()
  msStorageUrl!: string;
}

export class CustomConfig extends BackendConfig {
  @IsDefined()
  @Type(() => Number)
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => ExtendedMSURLsConfig)
  declare microServices: ExtendedMSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => AuthGeneratorConfig)
  declare auth: AuthGeneratorConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => PostgresConfig)
  db!: PostgresConfig;

  @IsDefined()
  emailEncryptionSecret!: string;
}
