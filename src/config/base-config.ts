import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import {
  BackendConfig,
  AuthGeneratorConfig,
  PostgresConfig,
  MSURLsConfig,
} from '@volontariapp/config';

export class CustomConfig extends BackendConfig {
  @IsDefined()
  @Type(() => Number)
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => MSURLsConfig)
  declare microServices: MSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => AuthGeneratorConfig)
  declare auth: AuthGeneratorConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => PostgresConfig)
  db!: PostgresConfig;
}
