import {
  Controller,
  Post,
  Patch,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard, Roles } from './roles.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @ApiOperation({ summary: 'Autenticação JWT' })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    if (!body.userId || !body.refreshToken) {
      throw new UnauthorizedException('Missing refresh token or user id');
    }
    const result = await this.authService.refreshToken(
      body.userId,
      body.refreshToken,
    );
    if (!result) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return result;
  }

  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { id: string; userId?: string } }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id?: string; userId?: string } },
    @Body() body: { name?: string; phone?: string; address?: string },
  ) {
    const id = req.user.id || req.user.userId;
    return this.authService.updateProfile(id!, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  savePushToken(
    @Request() req: { user: { id?: string; userId?: string } },
    @Body('token') token: string,
  ) {
    const id = req.user.id || req.user.userId;
    return this.authService.savePushToken(id!, token);
  }

  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reminders')
  getMyReminders(@Request() req: { user: { id?: string; userId?: string } }) {
    const id = req.user.id || req.user.userId;
    return this.authService.getUserReminders(id!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  async findAll() {
    return this.authService.findAll();
  }
}
