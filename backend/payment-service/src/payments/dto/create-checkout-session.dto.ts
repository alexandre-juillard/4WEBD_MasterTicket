import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty()
  @IsMongoId()
  eventId!: string;

  @ApiProperty()
  @IsString()
  eventTitle!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 49.9 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
