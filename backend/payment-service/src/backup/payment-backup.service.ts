import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as cron from 'node-cron';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

@Injectable()
export class PaymentBackupService implements OnModuleInit {
  private readonly logger = new Logger(PaymentBackupService.name);

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const cronPattern = this.configService.get<string>('PAYMENT_BACKUP_CRON', '0 */6 * * *');

    cron.schedule(cronPattern, async () => {
      await this.createBackup();
    });
  }

  private async createBackup(): Promise<void> {
    const backupDirectory = this.configService.get<string>('PAYMENT_BACKUP_DIR', '/app/backups');
    await fs.mkdir(backupDirectory, { recursive: true });

    const payments = await this.paymentModel.find().lean();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = join(backupDirectory, `payments-${timestamp}.json`);

    await fs.writeFile(backupFilePath, JSON.stringify(payments, null, 2), 'utf-8');
    this.logger.log(`Payment backup created at ${backupFilePath}`);
  }
}
