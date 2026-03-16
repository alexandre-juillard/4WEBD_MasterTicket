import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ConfirmPurchaseDto } from './dto/confirm-purchase.dto';
import { StartCheckoutDto } from './dto/start-checkout.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post('checkout')
  @ApiOperation({ summary: 'Start Stripe checkout for an event purchase' })
  startCheckout(@Body() startCheckoutDto: StartCheckoutDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.startCheckout(startCheckoutDto, user);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm paid checkout session and issue unique tickets' })
  confirmPurchase(@Body() confirmPurchaseDto: ConfirmPurchaseDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.confirmPurchase(confirmPurchaseDto, user);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List authenticated user tickets' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.ticketsService.findMine(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel one ticket and release one event seat' })
  cancel(@Param('id') ticketId: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.cancel(ticketId, user);
  }
}
