import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background job: ${job.name} (ID: ${job.id})`);

    // Simulate slow async task like Sending Email or generating heavy reports
    await new Promise((resolve) => setTimeout(resolve, 3000));

    this.logger.log(`Job completed: ${job.name}`);
    return { success: true };
  }
}
