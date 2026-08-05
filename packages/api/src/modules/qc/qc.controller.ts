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
import { QcService } from './qc.service';
import { CreateQCTestDto, UpdateQCTestDto, CompleteQCTestDto } from '../../dto';

@ApiTags('qc')
@Controller('qc')
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Get()
  @ApiOperation({ summary: 'Get all QC tests' })
  @ApiResponse({ status: 200, description: 'Return all QC tests' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('batchId') batchId?: string,
    @Query('testType') testType?: string,
    @Query('result') result?: string,
  ) {
    return this.qcService.findAll(organizationId, {
      batchId,
      testType,
      result,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get QC test statistics' })
  @ApiResponse({ status: 200, description: 'Return QC test statistics' })
  async getTestStats(@Query('organizationId') organizationId: string) {
    return this.qcService.getTestStats(organizationId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending QC tests' })
  @ApiResponse({ status: 200, description: 'Return pending QC tests' })
  async getPendingTests(@Query('organizationId') organizationId: string) {
    return this.qcService.getPendingTests(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get QC test by ID' })
  @ApiResponse({ status: 200, description: 'Return QC test by ID' })
  async findOne(@Param('id') id: string) {
    return this.qcService.findOne(id);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get QC tests by batch ID' })
  @ApiResponse({ status: 200, description: 'Return QC tests by batch ID' })
  async findByBatchId(@Param('batchId') batchId: string) {
    return this.qcService.findByBatchId(batchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create QC test' })
  @ApiResponse({ status: 201, description: 'QC test created' })
  async create(@Body() body: CreateQCTestDto) {
    return this.qcService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update QC test' })
  @ApiResponse({ status: 200, description: 'QC test updated' })
  async update(@Param('id') id: string, @Body() body: UpdateQCTestDto) {
    return this.qcService.update(id, body);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete QC test' })
  @ApiResponse({ status: 200, description: 'QC test completed' })
  async completeTest(
    @Param('id') id: string,
    @Body() body: CompleteQCTestDto,
  ) {
    return this.qcService.completeTest(id, body.actualValue, body.result as 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'INCONCLUSIVE', body.notes);
  }

  @Post(':id/certificate')
  @ApiOperation({ summary: 'Generate QC certificate' })
  @ApiResponse({ status: 200, description: 'QC certificate generated' })
  async generateCertificate(@Param('id') id: string) {
    const certificateNumber = await this.qcService.generateCertificate(id);
    return { certificateNumber };
  }
}
