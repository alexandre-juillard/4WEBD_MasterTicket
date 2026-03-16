import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  venue!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty({ example: '2026-10-01T19:30:00.000Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  totalSeats!: number;

  @ApiProperty({ example: 49.9 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ticketPrice!: number;
}
