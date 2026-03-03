import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @SkipThrottle()
    @Get()
    async check() {
        let databaseStatus = 'disconnected';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            databaseStatus = 'connected';
        } catch (e) {
            databaseStatus = 'disconnected';
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: databaseStatus,
            version: '1.0.0', // Pode vir do package.json depois se necessário
        };
    }
}
