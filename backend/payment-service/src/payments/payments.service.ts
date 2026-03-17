import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly stripeSecretKey: string;

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
  ) {
    this.stripeSecretKey = configService.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(this.stripeSecretKey);
  }

  private ensureStripeConfiguration(): void {
    if (!this.stripeSecretKey.startsWith('sk_test_') || this.stripeSecretKey.includes('replace_with')) {
      throw new BadRequestException(
        'Stripe is not configured. Set a valid STRIPE_SECRET_KEY (sk_test_...) in root .env and restart Docker Compose.',
      );
    }
  }

  async createCheckoutSession(createCheckoutSessionDto: CreateCheckoutSessionDto, user: JwtPayload) {
    this.ensureStripeConfiguration();

    const totalAmount = createCheckoutSessionDto.unitPrice * createCheckoutSessionDto.quantity;
    const successUrl = this.configService.get<string>(
      'FRONTEND_SUCCESS_URL',
      'http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}',
    );
    const cancelUrl = this.configService.get<string>(
      'FRONTEND_CANCEL_URL',
      'http://localhost:5173/payment/cancel',
    );

    let session: Stripe.Checkout.Session;

    try {
      session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: createCheckoutSessionDto.quantity,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(createCheckoutSessionDto.unitPrice * 100),
              product_data: {
                name: `Concert ticket - ${createCheckoutSessionDto.eventTitle}`,
              },
            },
          },
        ],
        metadata: {
          userId: user.sub,
          email: user.email,
          eventId: createCheckoutSessionDto.eventId,
          eventTitle: createCheckoutSessionDto.eventTitle,
          quantity: String(createCheckoutSessionDto.quantity),
          unitPrice: String(createCheckoutSessionDto.unitPrice),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe checkout failed';
      throw new BadGatewayException(`Stripe checkout failed: ${message}`);
    }

    await this.paymentModel.create({
      sessionId: session.id,
      userId: user.sub,
      email: user.email,
      eventId: createCheckoutSessionDto.eventId,
      eventTitle: createCheckoutSessionDto.eventTitle,
      quantity: createCheckoutSessionDto.quantity,
      unitPrice: createCheckoutSessionDto.unitPrice,
      totalAmount,
      status: PaymentStatus.Pending,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      amount: totalAmount,
      currency: 'EUR',
    };
  }

  async verifySession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const payment = await this.paymentModel.findOne({ sessionId });

    if (!payment) {
      throw new NotFoundException('Payment session not found');
    }

    const isPaid = session.payment_status === 'paid';
    payment.status = isPaid ? PaymentStatus.Paid : PaymentStatus.Pending;
    await payment.save();

    return {
      sessionId: payment.sessionId,
      status: payment.status,
      isPaid,
      userId: payment.userId,
      email: payment.email,
      eventId: payment.eventId,
      eventTitle: payment.eventTitle,
      quantity: payment.quantity,
      unitPrice: payment.unitPrice,
      totalAmount: payment.totalAmount,
    };
  }

  async findMine(user: JwtPayload) {
    return this.paymentModel.find({ userId: user.sub }).sort({ createdAt: -1 }).lean();
  }
}
