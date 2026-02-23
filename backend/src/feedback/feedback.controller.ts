import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: import('express').Request & { user: { userId: string } },
    @Body() data: { orderId: string; rating: number; comment?: string },
  ) {
    const userId = req.user.userId;
    return this.feedbackService.create({
      ...data,
      userId,
    });
  }

  @Get()
  async findAll() {
    return this.feedbackService.findAll();
  }
}
