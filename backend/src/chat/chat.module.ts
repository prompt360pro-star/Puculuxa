import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DatabaseModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [DatabaseModule, EventsModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule { }
