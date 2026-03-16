import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib';
import * as nodemailer from 'nodemailer';
import type { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly queueName = 'notifications.email';

  constructor(private readonly configService: ConfigService) { }

  async onModuleInit(): Promise<void> {
    await this.startConsumer();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async startConsumer(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });

    await this.channel.consume(this.queueName, async (message: ConsumeMessage | null) => {
      if (!message) {
        return;
      }

      await this.handleMessage(message);
    });

    this.logger.log('Notification consumer started');
  }

  private async handleMessage(message: ConsumeMessage): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString()) as SendEmailDto;
      await this.processMessage(payload);
      this.channel.ack(message);
    } catch (error) {
      this.logger.error('Email processing failed, message requeued', error as Error);
      this.channel.nack(message, false, true);
    }
  }

  async processMessage(payload: SendEmailDto): Promise<void> {
    const transport = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT', '2525')),
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });

    const fromAddress = this.configService.get<string>('SMTP_FROM', 'noreply@masterticket.local');

    const content = this.buildEmailContent(payload);

    await transport.sendMail({
      from: fromAddress,
      to: payload.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  }

  private buildEmailContent(payload: SendEmailDto) {
    if (payload.type === 'USER_REGISTERED') {
      return {
        subject: 'Welcome to MasterTicket',
        text: `Hello ${payload.fullName ?? 'user'}, your account has been created successfully.`,
        html: `<p>Hello <strong>${payload.fullName ?? 'user'}</strong>, your account has been created successfully.</p>`,
      };
    }

    return {
      subject: 'Your ticket purchase confirmation',
      text: `Purchase confirmed for ${payload.eventTitle}. Quantity: ${payload.quantity}. Unit price: ${payload.unitPrice} EUR. Total: ${payload.totalAmount} EUR.`,
      html: `
        <p>Your purchase has been confirmed.</p>
        <p><strong>Event:</strong> ${payload.eventTitle}</p>
        <p><strong>Quantity:</strong> ${payload.quantity}</p>
        <p><strong>Unit price:</strong> ${payload.unitPrice} EUR</p>
        <p><strong>Total:</strong> ${payload.totalAmount} EUR</p>
      `,
    };
  }
}
