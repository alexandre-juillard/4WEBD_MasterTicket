import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.createCheckoutSession(createCheckoutSessionDto, user);
  }

  @Get('verify-session/:sessionId')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({ summary: 'Internal endpoint to verify Stripe session payment status' })
  verifySession(@Param('sessionId') sessionId: string) {
    return this.paymentsService.verifySession(sessionId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List authenticated user payments' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.findMine(user);
  }
}
