import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsPositive } from 'class-validator';

export class StartCheckoutDto {
  @ApiProperty()
  @IsMongoId()
  eventId!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}
