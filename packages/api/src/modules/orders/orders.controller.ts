import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, CancelOrderDto } from '../../dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sales orders' })
  @ApiResponse({ status: 200, description: 'Return all sales orders' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('orderType') orderType?: string,
  ) {
    return this.ordersService.findAll(organizationId, {
      status,
      customerId,
      orderType,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Return order statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.ordersService.getOrderStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiResponse({ status: 200, description: 'Return sales order by ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('order/:orderNumber')
  @ApiOperation({ summary: 'Get sales order by order number' })
  @ApiResponse({ status: 200, description: 'Return sales order by order number' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Post()
  @ApiOperation({ summary: 'Create sales order' })
  @ApiResponse({ status: 201, description: 'Sales order created' })
  async create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales order' })
  @ApiResponse({ status: 200, description: 'Sales order updated' })
  async update(@Param('id') id: string, @Body() body: UpdateOrderDto) {
    return this.ordersService.update(id, body);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm sales order' })
  @ApiResponse({ status: 200, description: 'Sales order confirmed' })
  async confirm(@Param('id') id: string) {
    return this.ordersService.confirm(id);
  }

  @Post(':id/start-production')
  @ApiOperation({ summary: 'Start order production' })
  @ApiResponse({ status: 200, description: 'Order production started' })
  async startProduction(@Param('id') id: string) {
    return this.ordersService.startProduction(id);
  }

  @Post(':id/ready-for-dispatch')
  @ApiOperation({ summary: 'Mark order ready for dispatch' })
  @ApiResponse({ status: 200, description: 'Order ready for dispatch' })
  async readyForDispatch(@Param('id') id: string) {
    return this.ordersService.readyForDispatch(id);
  }

  @Post(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch order' })
  @ApiResponse({ status: 200, description: 'Order dispatched' })
  async dispatch(@Param('id') id: string) {
    return this.ordersService.dispatch(id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Mark order delivered' })
  @ApiResponse({ status: 200, description: 'Order delivered' })
  async deliver(@Param('id') id: string) {
    return this.ordersService.deliver(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sales order' })
  @ApiResponse({ status: 200, description: 'Sales order cancelled' })
  async cancel(@Param('id') id: string, @Body() body: CancelOrderDto) {
    return this.ordersService.cancel(id, body.reason);
  }
}
