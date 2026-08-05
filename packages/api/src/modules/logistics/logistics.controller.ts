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
import { LogisticsService } from './logistics.service';

@ApiTags('logistics')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  @ApiResponse({ status: 200, description: 'Return all shipments' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('salesOrderId') salesOrderId?: string,
  ) {
    return this.logisticsService.findAll(organizationId, {
      status,
      salesOrderId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get logistics statistics' })
  @ApiResponse({ status: 200, description: 'Return logistics statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.logisticsService.getLogisticsStats(organizationId);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'Return all vehicles' })
  async getVehicles() {
    return this.logisticsService.getVehicles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  @ApiResponse({ status: 200, description: 'Return shipment by ID' })
  async findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Get('shipment/:shipmentNumber')
  @ApiOperation({ summary: 'Get shipment by shipment number' })
  @ApiResponse({ status: 200, description: 'Return shipment by shipment number' })
  async findByShipmentNumber(@Param('shipmentNumber') shipmentNumber: string) {
    return this.logisticsService.findByShipmentNumber(shipmentNumber);
  }

  @Post()
  @ApiOperation({ summary: 'Create shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  async create(@Body() body: any) {
    return this.logisticsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update shipment' })
  @ApiResponse({ status: 200, description: 'Shipment updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.update(id, body);
  }

  @Post(':id/load')
  @ApiOperation({ summary: 'Load shipment' })
  @ApiResponse({ status: 200, description: 'Shipment loaded' })
  async loadShipment(@Param('id') id: string) {
    return this.logisticsService.loadShipment(id);
  }

  @Post(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch shipment' })
  @ApiResponse({ status: 200, description: 'Shipment dispatched' })
  async dispatch(@Param('id') id: string) {
    return this.logisticsService.dispatch(id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Deliver shipment' })
  @ApiResponse({ status: 200, description: 'Shipment delivered' })
  async deliver(@Param('id') id: string) {
    return this.logisticsService.deliver(id);
  }

  @Post(':id/temperature-log')
  @ApiOperation({ summary: 'Update temperature log' })
  @ApiResponse({ status: 200, description: 'Temperature log updated' })
  async updateTemperatureLog(
    @Param('id') id: string,
    @Body() body: { temperatureLog: Array<{ timestamp: Date; temperature: number }> },
  ) {
    return this.logisticsService.updateTemperatureLog(id, body.temperatureLog);
  }

  @Post(':id/gps-log')
  @ApiOperation({ summary: 'Update GPS log' })
  @ApiResponse({ status: 200, description: 'GPS log updated' })
  async updateGPSLog(
    @Param('id') id: string,
    @Body() body: { gpsLog: Array<{ timestamp: Date; lat: number; lng: number }> },
  ) {
    return this.logisticsService.updateGPSLog(id, body.gpsLog);
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Create vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created' })
  async createVehicle(@Body() body: any) {
    return this.logisticsService.createVehicle(body);
  }
}
