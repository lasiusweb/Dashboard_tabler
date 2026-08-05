import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Batch ID' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit (GRAM, ML, KG, LITER, PIECE)' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'GST rate override (uses product default if omitted)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  gstRate?: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Customer (Party) ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Order type', enum: ['DISTRIBUTOR', 'DIRECT', 'GOVERNMENT', 'EXPORT'] })
  @IsString()
  @IsIn(['DISTRIBUTOR', 'DIRECT', 'GOVERNMENT', 'EXPORT'])
  @IsOptional()
  orderType?: string;

  @ApiProperty({ description: 'Order line items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Shipping city' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping state' })
  @IsString()
  @IsOptional()
  shippingState?: string;

  @ApiPropertyOptional({ description: 'Shipping pincode' })
  @IsString()
  @IsOptional()
  shippingPincode?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsString()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Required by date' })
  @IsOptional()
  requiredByDate?: Date;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Customer (Party) ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Order type', enum: ['DISTRIBUTOR', 'DIRECT', 'GOVERNMENT', 'EXPORT'] })
  @IsString()
  @IsIn(['DISTRIBUTOR', 'DIRECT', 'GOVERNMENT', 'EXPORT'])
  @IsOptional()
  orderType?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Shipping city' })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping state' })
  @IsString()
  @IsOptional()
  shippingState?: string;

  @ApiPropertyOptional({ description: 'Shipping pincode' })
  @IsString()
  @IsOptional()
  shippingPincode?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Required by date' })
  @IsOptional()
  requiredByDate?: Date;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
