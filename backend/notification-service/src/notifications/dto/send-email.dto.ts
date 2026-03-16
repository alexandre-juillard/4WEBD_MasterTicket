import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
    @ApiProperty({ enum: ['USER_REGISTERED', 'TICKET_PURCHASED'] })
    @IsIn(['USER_REGISTERED', 'TICKET_PURCHASED'])
    type!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    eventTitle?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    unitPrice?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    totalAmount?: number;
}
