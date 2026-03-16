import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum TicketStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
}

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, unique: true })
  ticketNumber!: string;

  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userEmail!: string;

  @Prop({ required: true })
  unitPrice!: number;

  @Prop({ required: true })
  eventTitle!: string;

  @Prop({ required: true })
  paymentSessionId!: string;

  @Prop({ enum: Object.values(TicketStatus), default: TicketStatus.Active })
  status!: TicketStatus;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
