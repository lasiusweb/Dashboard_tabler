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
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, UpdateInvoiceDto, CreatePaymentDto, CancelInvoiceDto } from '../../dto';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Return all invoices' })
  async findAllInvoices(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.financeService.findAllInvoices(organizationId, {
      status,
      type,
      customerId,
      vendorId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get finance statistics' })
  @ApiResponse({ status: 200, description: 'Return finance statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.financeService.getFinanceStats(organizationId);
  }

  @Get('invoices/overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200, description: 'Return overdue invoices' })
  async getOverdueInvoices(@Query('organizationId') organizationId: string) {
    return this.financeService.getOverdueInvoices(organizationId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Return invoice by ID' })
  async findOneInvoice(@Param('id') id: string) {
    return this.financeService.findOneInvoice(id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async createInvoice(@Body() body: CreateInvoiceDto) {
    return this.financeService.createInvoice(body);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated' })
  async updateInvoice(@Param('id') id: string, @Body() body: UpdateInvoiceDto) {
    return this.financeService.updateInvoice(id, body);
  }

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Send invoice' })
  @ApiResponse({ status: 200, description: 'Invoice sent' })
  async sendInvoice(@Param('id') id: string) {
    return this.financeService.sendInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  async cancelInvoice(@Param('id') id: string, @Body() body: CancelInvoiceDto) {
    return this.financeService.cancelInvoice(id, body.reason);
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Create payment for invoice' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async createPayment(
    @Param('id') id: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.financeService.createPayment(id, body);
  }
}
