import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtPayload, UserRole } from '../common/interfaces/jwt-payload.interface';
import { AdjustSeatsDto } from './dto/adjust-seats.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDocument, EventEntity } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(EventEntity.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto, user: JwtPayload) {
    const created = await this.eventModel.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
      remainingSeats: createEventDto.totalSeats,
      createdByUserId: user.sub,
    });

    return created;
  }

  async findAll() {
    return this.eventModel.find().sort({ date: 1 }).lean();
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).lean();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, user: JwtPayload) {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isAdmin = user.role === UserRole.Admin;
    const isOperator = user.role === UserRole.Operator;
    const isOwner = event.createdByUserId === user.sub;

    if (!isAdmin && !isOperator && !isOwner) {
      throw new ForbiddenException('You cannot update this event');
    }

    if (updateEventDto.totalSeats && updateEventDto.totalSeats < event.totalSeats - event.remainingSeats) {
      throw new ForbiddenException('Total seats cannot be lower than already sold seats');
    }

    if (updateEventDto.totalSeats) {
      const soldSeats = event.totalSeats - event.remainingSeats;
      event.remainingSeats = updateEventDto.totalSeats - soldSeats;
      event.totalSeats = updateEventDto.totalSeats;
    }

    if (updateEventDto.date) {
      event.date = new Date(updateEventDto.date);
    }

    if (updateEventDto.title) event.title = updateEventDto.title;
    if (updateEventDto.description) event.description = updateEventDto.description;
    if (updateEventDto.venue) event.venue = updateEventDto.venue;
    if (updateEventDto.city) event.city = updateEventDto.city;
    if (updateEventDto.ticketPrice !== undefined) event.ticketPrice = updateEventDto.ticketPrice;

    await event.save();
    return event;
  }

  async remove(id: string, user: JwtPayload) {
    const event = await this.eventModel.findById(id).lean();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isAdmin = user.role === UserRole.Admin;
    const isOwner = event.createdByUserId === user.sub;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You cannot delete this event');
    }

    await this.eventModel.deleteOne({ _id: id });
  }

  async reserveSeats(id: string, adjustSeatsDto: AdjustSeatsDto) {
    const updatedEvent = await this.eventModel.findOneAndUpdate(
      {
        _id: id,
        remainingSeats: { $gte: adjustSeatsDto.quantity },
      },
      {
        $inc: { remainingSeats: -adjustSeatsDto.quantity },
      },
      { new: true },
    );

    if (!updatedEvent) {
      throw new ForbiddenException('Not enough remaining seats');
    }

    return updatedEvent;
  }

  async releaseSeats(id: string, adjustSeatsDto: AdjustSeatsDto) {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    event.remainingSeats = Math.min(event.totalSeats, event.remainingSeats + adjustSeatsDto.quantity);
    await event.save();

    return event;
  }
}
