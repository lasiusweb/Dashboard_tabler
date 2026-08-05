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
import { BatchesService } from './batches.service';

@ApiTags('batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all batches' })
  @ApiResponse({ status: 200, description: 'Return all batches' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('expiryWarning') expiryWarning?: boolean,
  ) {
    return this.batchesService.findAll(organizationId, {
      status,
      productId,
      expiryWarning,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get batch statistics' })
  @ApiResponse({ status: 200, description: 'Return batch statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.batchesService.getStats(organizationId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring batches' })
  @ApiResponse({ status: 200, description: 'Return expiring batches' })
  async getExpiringBatches(
    @Query('organizationId') organizationId: string,
    @Query('daysWarning') daysWarning?: number,
  ) {
    return this.batchesService.getExpiringBatches(organizationId, daysWarning);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch by ID' })
  @ApiResponse({ status: 200, description: 'Return batch by ID' })
  async findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Get('batch/:batchNumber')
  @ApiOperation({ summary: 'Get batch by batch number' })
  @ApiResponse({ status: 200, description: 'Return batch by batch number' })
  async findByBatchNumber(@Param('batchNumber') batchNumber: string) {
    return this.batchesService.findByBatchNumber(batchNumber);
  }

  @Post()
  @ApiOperation({ summary: 'Create batch' })
  @ApiResponse({ status: 201, description: 'Batch created' })
  async create(@Body() body: any) {
    return this.batchesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update batch' })
  @ApiResponse({ status: 200, description: 'Batch updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.batchesService.update(id, body);
  }

  @Post(':id/start-production')
  @ApiOperation({ summary: 'Start batch production' })
  @ApiResponse({ status: 200, description: 'Production started' })
  async startProduction(@Param('id') id: string) {
    return this.batchesService.startProduction(id);
  }

  @Post(':id/complete-production')
  @ApiOperation({ summary: 'Complete batch production' })
  @ApiResponse({ status: 200, description: 'Production completed' })
  async completeProduction(
    @Param('id') id: string,
    @Body() body: { actualQuantity: number },
  ) {
    return this.batchesService.completeProduction(id, body.actualQuantity);
  }

  @Post(':id/qc-status')
  @ApiOperation({ summary: 'Update batch QC status' })
  @ApiResponse({ status: 200, description: 'QC status updated' })
  async updateQCStatus(
    @Param('id') id: string,
    @Body() body: { qcStatus: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS'; certificateNumber?: string },
  ) {
    return this.batchesService.updateQCStatus(id, body.qcStatus, body.certificateNumber);
  }

  @Post(':id/package')
  @ApiOperation({ summary: 'Package batch' })
  @ApiResponse({ status: 200, description: 'Batch packaged' })
  async packageBatch(
    @Param('id') id: string,
    @Body() body: { packagingType: string; unitsProduced: number; packagingDate?: Date },
  ) {
    return this.batchesService.packageBatch(id, body);
  }

  @Post(':id/ready-for-dispatch')
  @ApiOperation({ summary: 'Mark batch ready for dispatch' })
  @ApiResponse({ status: 200, description: 'Batch ready for dispatch' })
  async readyForDispatch(@Param('id') id: string) {
    return this.batchesService.readyForDispatch(id);
  }
}
