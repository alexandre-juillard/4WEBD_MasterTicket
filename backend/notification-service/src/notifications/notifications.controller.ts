import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendEmailDto } from './dto/send-email.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Service health endpoint' })
  health() {
    return { status: 'ok' };
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Manual email trigger for testing' })
  async sendTestEmail(@Body() sendEmailDto: SendEmailDto) {
    await this.notificationsService.processMessage(sendEmailDto);
    return { message: 'Email processing triggered' };
  }
}
