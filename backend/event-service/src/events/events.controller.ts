import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/interfaces/jwt-payload.interface';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AdjustSeatsDto } from './dto/adjust-seats.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Get()
  @ApiOperation({ summary: 'Public list of events and remaining seats' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public event details' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.EventCreator)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create event (Admin, EventCreator)' })
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: JwtPayload) {
    return this.eventsService.create(createEventDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.EventCreator, UserRole.Operator)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update event (Admin, EventCreator owner, Operator)' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, updateEventDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.EventCreator)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete event (Admin, EventCreator owner)' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.eventsService.remove(id, user);
    return { message: 'Event deleted' };
  }

  @Post(':id/reserve')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({ summary: 'Internal reserve seats for ticket purchase' })
  reserve(@Param('id') id: string, @Body() adjustSeatsDto: AdjustSeatsDto) {
    return this.eventsService.reserveSeats(id, adjustSeatsDto);
  }

  @Post(':id/release')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({ summary: 'Internal release seats after ticket cancellation' })
  release(@Param('id') id: string, @Body() adjustSeatsDto: AdjustSeatsDto) {
    return this.eventsService.releaseSeats(id, adjustSeatsDto);
  }
}
