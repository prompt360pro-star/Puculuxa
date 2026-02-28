import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.feedbackService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/reply')
  async replyToFeedback(
    @Param('id') id: string,
    @Body('adminReply') adminReply: string,
  ) {
    return this.feedbackService.replyToFeedback(id, adminReply);
  }
}
