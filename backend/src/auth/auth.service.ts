import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    console.log(`\n\n[AUTH-DIAGNOSTIC] Tentativa de Login Recebida`);
    console.log(`[AUTH-DIAGNOSTIC] Email fornecido: "${email}"`);
    console.log(`[AUTH-DIAGNOSTIC] Password fornecida: "${pass}"`);

    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log(`[AUTH-DIAGNOSTIC] Utilizador encontrado na DB:`, user ? `SIM (Role: ${user.role})` : `NÃO ENCONTRADO`);

    if (user && (await bcrypt.compare(pass, user.password))) {
      console.log(`[AUTH-DIAGNOSTIC] Match BCRYPT: SUCESSO`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    console.log(`[AUTH-DIAGNOSTIC] Match BCRYPT: FALHA (Ou User não existe)`);
    return null;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    // Refresh token lives longer, e.g., 7 days
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Hash refresh token before saving
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      return null;
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      return null;
    }

    try {
      this.jwtService.verify(refreshToken);
    } catch (e) {
      return null; // Token expired or invalid
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return this.login(userWithoutPassword);
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: 'CUSTOMER', // Hardcoded for security. Admins must be created via seed or DB access.
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(
    id: string,
    data: { name?: string; phone?: string; address?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated;
    return result;
  }

  async savePushToken(id: string, pushToken: string) {
    await this.prisma.user.update({
      where: { id },
      data: { pushToken },
    });
    return { ok: true };
  }

  async getUserReminders(userId: string) {
    return this.prisma.eventReminder.findMany({
      where: { userId },
      orderBy: { nextReminder: 'asc' },
      select: {
        id: true,
        eventName: true,
        eventType: true,
        eventDate: true,
        nextReminder: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always respond with success to avoid user enumeration
    if (!user)
      return { message: 'Se o e-mail existir, as instruções serão enviadas.' };

    // Generate a short-lived signed token (15 min expiry)
    const token = this.jwtService.sign(
      { sub: user.id, purpose: 'reset' },
      { expiresIn: '15m' },
    );

    // Persist the token in the user record for validation
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token },
    });

    // In production this would be sent via email. For now log to console.
    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    return { message: 'Se o e-mail existir, as instruções serão enviadas.' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(token) as {
        sub: string;
        purpose: string;
      };
    } catch {
      throw new Error('Token inválido ou expirado');
    }

    if (payload.purpose !== 'reset') throw new Error('Token inválido');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.resetToken !== token)
      throw new Error('Token já utilizado');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashed, resetToken: null },
    });

    return { message: 'Password redefinida com sucesso' };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...user }) => user);
  }
}
