import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RabbitPublisher } from '../rabbit/rabbit.publisher';
import { ConfirmPurchaseDto } from './dto/confirm-purchase.dto';
import { StartCheckoutDto } from './dto/start-checkout.dto';
import { Ticket, TicketDocument, TicketStatus } from './schemas/ticket.schema';

interface EventSummary {
  _id: string;
  title: string;
  ticketPrice: number;
  remainingSeats: number;
}

interface VerifiedPayment {
  sessionId: string;
  status: string;
  isPaid: boolean;
  userId: string;
  email: string;
  eventId: string;
  eventTitle: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    private readonly configService: ConfigService,
    private readonly rabbitPublisher: RabbitPublisher,
  ) { }

  private get eventServiceUrl() {
    return this.configService.getOrThrow<string>('EVENT_SERVICE_URL');
  }

  private get paymentServiceUrl() {
    return this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL');
  }

  private get internalApiKey() {
    return this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async startCheckout(startCheckoutDto: StartCheckoutDto, user: JwtPayload) {
    let event: EventSummary;

    try {
      const eventResponse = await axios.get<EventSummary>(
        `${this.eventServiceUrl}/api/events/${startCheckoutDto.eventId}`,
      );
      event = eventResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string | string[] } | undefined)?.message ??
          'Unable to fetch event before checkout';
        throw new BadGatewayException(Array.isArray(message) ? message.join(', ') : message);
      }

      throw new BadGatewayException('Unable to fetch event before checkout');
    }

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.remainingSeats < startCheckoutDto.quantity) {
      throw new ConflictException('Not enough remaining seats');
    }

    try {
      const checkoutResponse = await axios.post(
        `${this.paymentServiceUrl}/api/payments/checkout-session`,
        {
          eventId: event._id,
          eventTitle: event.title,
          quantity: startCheckoutDto.quantity,
          unitPrice: event.ticketPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      return checkoutResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string | string[] } | undefined)?.message ??
          'Checkout initialization failed';
        throw new BadGatewayException(Array.isArray(message) ? message.join(', ') : message);
      }

      throw new BadGatewayException('Checkout initialization failed');
    }
  }

  async confirmPurchase(confirmPurchaseDto: ConfirmPurchaseDto, user: JwtPayload) {
    const existingTickets = await this.ticketModel
      .find({ paymentSessionId: confirmPurchaseDto.sessionId, userId: user.sub })
      .lean();

    if (existingTickets.length > 0) {
      return {
        message: 'Purchase already confirmed',
        tickets: existingTickets,
      };
    }

    const verificationResponse = await axios.get<VerifiedPayment>(
      `${this.paymentServiceUrl}/api/payments/verify-session/${confirmPurchaseDto.sessionId}`,
      {
        headers: {
          'x-internal-api-key': this.internalApiKey,
        },
      },
    );

    const payment = verificationResponse.data;

    if (!payment.isPaid) {
      throw new ForbiddenException('Payment is not completed');
    }

    if (payment.userId !== user.sub) {
      throw new ForbiddenException('Session is not linked to this user');
    }

    try {
      await axios.post(
        `${this.eventServiceUrl}/api/events/${payment.eventId}/reserve`,
        { quantity: payment.quantity },
        {
          headers: {
            'x-internal-api-key': this.internalApiKey,
          },
        },
      );
    } catch (error) {
      throw new ConflictException('Unable to reserve seats for this payment session');
    }

    const ticketsPayload = Array.from({ length: payment.quantity }).map((_, index) => ({
      ticketNumber: `TCK-${Date.now()}-${Math.floor(Math.random() * 100000)}-${index + 1}`,
      eventId: payment.eventId,
      userId: user.sub,
      userEmail: payment.email,
      unitPrice: payment.unitPrice,
      eventTitle: payment.eventTitle,
      paymentSessionId: payment.sessionId,
      status: TicketStatus.Active,
    }));

    const createdTickets = await this.ticketModel.insertMany(ticketsPayload);

    await this.rabbitPublisher.publish('notifications.email', {
      type: 'TICKET_PURCHASED',
      email: payment.email,
      eventTitle: payment.eventTitle,
      quantity: payment.quantity,
      unitPrice: payment.unitPrice,
      totalAmount: payment.totalAmount,
      purchasedAt: new Date().toISOString(),
    });

    return {
      message: 'Purchase confirmed',
      tickets: createdTickets,
    };
  }

  async findMine(user: JwtPayload) {
    return this.ticketModel.find({ userId: user.sub }).sort({ createdAt: -1 }).lean();
  }

  async cancel(ticketId: string, user: JwtPayload) {
    const ticket = await this.ticketModel.findById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== user.sub) {
      throw new ForbiddenException('You cannot cancel this ticket');
    }

    if (ticket.status === TicketStatus.Cancelled) {
      throw new BadRequestException('Ticket is already cancelled');
    }

    ticket.status = TicketStatus.Cancelled;
    await ticket.save();

    await axios.post(
      `${this.eventServiceUrl}/api/events/${ticket.eventId}/release`,
      { quantity: 1 },
      {
        headers: {
          'x-internal-api-key': this.internalApiKey,
        },
      },
    );

    return {
      message: 'Ticket cancelled and seat released',
      ticket,
    };
  }
}
