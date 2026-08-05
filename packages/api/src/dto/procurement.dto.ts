import { IsString, IsOptional, IsNumber, Min, Max, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ description: 'Raw material ID' })
  @IsString()
  rawMaterialId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'GST rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  gstRate: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Vendor (Party) ID' })
  @IsString()
  vendorId: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  expectedDate?: Date;

  @ApiProperty({ description: 'Order items', type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ description: 'Received items', type: [Object] })
  @IsArray()
  @ValidateNested({ each: true })
  receivedItems: Array<{ itemId: string; receivedQuantity: number }>;
}

export class CancelPurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
