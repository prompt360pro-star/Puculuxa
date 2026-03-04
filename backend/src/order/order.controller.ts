import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderService, OrderStatus } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class CreateOrderDto {
  total!: number;
  items!: { productId: string; name: string; price: number; quantity: number }[];
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    return this.orderService.findAll(pageNumber, limitNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyOrders(@Req() req: { user: { id: string } }) {
    return this.orderService.findMyOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: { user: { id: string } }, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create({
      userId: req.user.id,
      total: createOrderDto.total,
      items: createOrderDto.items,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const userId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;
    if (userRole === 'CUSTOMER' && order.userId !== userId) {
      throw new ForbiddenException('Não tem permissão para ver este pedido');
    }
    return order;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.orderService.updateStatus(id, status);
  }
}
