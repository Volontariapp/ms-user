import { ApiProperty } from '@nestjs/swagger';

export class TestOutboxResponse {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  count!: number;

  @ApiProperty({ type: [String] })
  ids!: string[];
}