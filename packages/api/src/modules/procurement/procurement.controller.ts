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
import { ProcurementService } from './procurement.service';

@ApiTags('procurement')
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiResponse({ status: 200, description: 'Return all purchase orders' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.procurementService.findAll(organizationId, {
      status,
      vendorId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get procurement statistics' })
  @ApiResponse({ status: 200, description: 'Return procurement statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.procurementService.getProcurementStats(organizationId);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get vendor statistics' })
  @ApiResponse({ status: 200, description: 'Return vendor statistics' })
  async getVendorStats(@Query('organizationId') organizationId: string) {
    return this.procurementService.getVendorStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Return purchase order by ID' })
  async findOne(@Param('id') id: string) {
    return this.procurementService.findOne(id);
  }

  @Get('po/:poNumber')
  @ApiOperation({ summary: 'Get purchase order by PO number' })
  @ApiResponse({ status: 200, description: 'Return purchase order by PO number' })
  async findByPoNumber(@Param('poNumber') poNumber: string) {
    return this.procurementService.findByPoNumber(poNumber);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created' })
  async create(@Body() body: any) {
    return this.procurementService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.procurementService.update(id, body);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order submitted' })
  async submit(@Param('id') id: string) {
    return this.procurementService.submit(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order confirmed' })
  async confirm(@Param('id') id: string) {
    return this.procurementService.confirm(id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive purchase order items' })
  @ApiResponse({ status: 200, description: 'Purchase order items received' })
  async receive(
    @Param('id') id: string,
    @Body() body: { receivedItems: Array<{ itemId: string; receivedQuantity: number }> },
  ) {
    return this.procurementService.receive(id, body.receivedItems);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled' })
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.procurementService.cancel(id, body.reason);
  }
}
