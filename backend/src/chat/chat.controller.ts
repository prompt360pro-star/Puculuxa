import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Req,
    Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class SendMessageDto {
    text!: string;
}

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    // Cliente procura o seu histórico
    @UseGuards(JwtAuthGuard)
    @Get('my')
    findMyMessages(@Req() req: { user: { id: string } }) {
        return this.chatService.getMyMessages(req.user.id);
    }

    // Cliente envia mensagem
    @UseGuards(JwtAuthGuard)
    @Post('my')
    sendMessage(@Req() req: { user: { id: string, role: string } }, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(req.user.id, dto.text, "CUSTOMER");
    }

    // Admin lista coversas
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('users')
    getConversations() {
        return this.chatService.getAllUsersWithMessages();
    }

    // Admin vê chat de um cliente
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('user/:userId')
    getUserMessages(@Param('userId') userId: string) {
        return this.chatService.getMyMessages(userId);
    }

    // Admin responde
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('user/:userId')
    adminReply(@Param('userId') userId: string, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(userId, dto.text, "ADMIN");
    }
}
