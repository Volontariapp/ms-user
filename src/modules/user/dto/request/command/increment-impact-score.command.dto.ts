import type { IncrementImpactScoreCommand } from '@volontariapp/contracts-nest';
import { IsNumber, IsString } from 'class-validator';

export class IncrementImpactScoreCommandDTO implements IncrementImpactScoreCommand {
  @IsString()
  userId!: string;

  @IsNumber()
  scoreIncrement!: number;
}
