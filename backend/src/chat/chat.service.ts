import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly events: EventsGateway,
    ) { }

    async getMyMessages(userId: string) {
        return this.prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }, // Antigas primeiro para UI de chat
        });
    }

    async getAllUsersWithMessages() {
        // Para o painel admin: listar todos os clientes que enviaram mensagem
        const users = await this.prisma.user.findMany({
            where: {
                messages: {
                    some: {}
                }
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        return users.map(user => ({
            ...user,
            lastMessage: user.messages[0],
        })).sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    }

    async sendMessage(userId: string, text: string, sender: string = "CUSTOMER") {
        // userId is always the Customer's ID indicating the room
        const message = await this.prisma.chatMessage.create({
            data: {
                userId,
                text,
                sender,
            }
        });

        // Notify connected clients
        this.events.server.emit(`chat_${userId}`, message);
        if (sender === "CUSTOMER") {
            this.events.notifyAdmins('new_chat_message', message);
        }

        return message;
    }
}
