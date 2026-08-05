import { IsString, IsOptional, IsNumber, Min, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Sales order ID' })
  @IsString()
  @IsOptional()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID' })
  @IsString()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Vendor (Party) ID' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Customer (Party) ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Invoice type', enum: ['SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE'] })
  @IsString()
  @IsIn(['SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE'])
  type: string;

  @ApiProperty({ description: 'Subtotal' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'CGST amount', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cgstAmount?: number;

  @ApiPropertyOptional({ description: 'SGST amount', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sgstAmount?: number;

  @ApiPropertyOptional({ description: 'IGST amount', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  igstAmount?: number;

  @ApiPropertyOptional({ description: 'TDS amount', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tdsAmount?: number;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: ['BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE', 'NEFT', 'RTGS'] })
  @IsString()
  @IsIn(['BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE', 'NEFT', 'RTGS'])
  method: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Vendor account ID' })
  @IsString()
  @IsOptional()
  vendorAccountId?: string;
}

export class CancelInvoiceDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
