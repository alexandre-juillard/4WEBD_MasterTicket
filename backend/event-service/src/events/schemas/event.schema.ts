import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<EventEntity>;

@Schema({ timestamps: true })
export class EventEntity {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  venue!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, min: 1 })
  totalSeats!: number;

  @Prop({ required: true, min: 0 })
  remainingSeats!: number;

  @Prop({ required: true, min: 0 })
  ticketPrice!: number;

  @Prop({ required: true })
  createdByUserId!: string;
}

export const EventSchema = SchemaFactory.createForClass(EventEntity);
