import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FollowUpService, CreateFollowUpDto } from './followup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('followups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FollowUpController {
    constructor(private readonly followUpService: FollowUpService) { }

    @Post(':orderId')
    async createFollowUp(
        @Param('orderId') orderId: string,
        @Body() dto: CreateFollowUpDto,
        @Req() req: Request
    ) {
        const adminId = (req as any).user?.id || 'SYSTEM';
        return this.followUpService.createFollowUp(orderId, adminId, dto);
    }

    @Get('due/today')
    async listNextFollowUpsDue() {
        return this.followUpService.listNextFollowUpsDue();
    }

    @Get(':orderId')
    async listFollowUps(@Param('orderId') orderId: string) {
        return this.followUpService.listFollowUps(orderId);
    }
}
