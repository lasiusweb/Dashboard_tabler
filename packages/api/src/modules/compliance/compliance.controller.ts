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
import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all compliance records' })
  @ApiResponse({ status: 200, description: 'Return all compliance records' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('certType') certType?: string,
    @Query('status') status?: string,
    @Query('partyId') partyId?: string,
  ) {
    return this.complianceService.findAll(organizationId, {
      certType,
      status,
      partyId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get compliance statistics' })
  @ApiResponse({ status: 200, description: 'Return compliance statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.complianceService.getComplianceStats(organizationId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring compliance records' })
  @ApiResponse({ status: 200, description: 'Return expiring records' })
  async getExpiring(
    @Query('organizationId') organizationId: string,
    @Query('daysWarning') daysWarning?: number,
  ) {
    return this.complianceService.getExpiringRecords(organizationId, daysWarning);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compliance record by ID' })
  @ApiResponse({ status: 200, description: 'Return compliance record by ID' })
  async findOne(@Param('id') id: string) {
    return this.complianceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create compliance record' })
  @ApiResponse({ status: 201, description: 'Compliance record created' })
  async create(@Body() body: any) {
    return this.complianceService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update compliance record' })
  @ApiResponse({ status: 200, description: 'Compliance record updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.complianceService.update(id, body);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew compliance record' })
  @ApiResponse({ status: 200, description: 'Compliance record renewed' })
  async renew(
    @Param('id') id: string,
    @Body() body: {
      newCertificateNumber: string;
      newExpiryDate: Date;
      issuedBy?: string;
      documentUrl?: string;
    },
  ) {
    return this.complianceService.renew(id, body);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend compliance record' })
  @ApiResponse({ status: 200, description: 'Compliance record suspended' })
  async suspend(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.complianceService.suspend(id, body.reason);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke compliance record' })
  @ApiResponse({ status: 200, description: 'Compliance record revoked' })
  async revoke(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.complianceService.revoke(id, body.reason);
  }

  @Get('verify/fssai/:fssaiNumber')
  @ApiOperation({ summary: 'Verify FSSAI number' })
  @ApiResponse({ status: 200, description: 'FSSAI verification result' })
  async verifyFSSAI(@Param('fssaiNumber') fssaiNumber: string) {
    return this.complianceService.verifyFSSAI(fssaiNumber);
  }

  @Get('verify/gst/:gstin')
  @ApiOperation({ summary: 'Verify GST number' })
  @ApiResponse({ status: 200, description: 'GST verification result' })
  async verifyGST(@Param('gstin') gstin: string) {
    return this.complianceService.verifyGST(gstin);
  }
}
