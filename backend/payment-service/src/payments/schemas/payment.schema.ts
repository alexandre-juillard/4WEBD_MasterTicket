import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Failed = 'FAILED',
}

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  sessionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  eventTitle!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  unitPrice!: number;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ enum: Object.values(PaymentStatus), default: PaymentStatus.Pending })
  status!: PaymentStatus;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
