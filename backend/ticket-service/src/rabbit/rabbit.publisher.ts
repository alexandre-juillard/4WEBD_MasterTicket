import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitPublisher.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) { }

  private async ensureConnection(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();

    return this.channel;
  }

  async publish(queueName: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const channel = await this.ensureConnection();
      await channel.assertQueue(queueName, { durable: true });
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });
    } catch (error) {
      this.logger.error('Failed to publish message', error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
