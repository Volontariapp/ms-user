import type { LoginCommand } from '@volontariapp/contracts-nest';
import { IsEmail, IsString } from 'class-validator';

export class LoginCommandDTO implements LoginCommand {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
