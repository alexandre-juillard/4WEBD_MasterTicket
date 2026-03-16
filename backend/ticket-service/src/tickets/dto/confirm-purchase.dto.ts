import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmPurchaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  sessionId!: string;
}
