import { IsString, IsOptional, IsNumber, Min, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Movement type', enum: ['RECEIPT', 'PRODUCTION_OUTPUT', 'DISPATCH', 'EXPIRY_WRITE_OFF', 'TRANSFER', 'ADJUSTMENT', 'DAMAGE'] })
  @IsString()
  @IsIn(['RECEIPT', 'PRODUCTION_OUTPUT', 'DISPATCH', 'EXPIRY_WRITE_OFF', 'TRANSFER', 'ADJUSTMENT', 'DAMAGE'])
  type: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Raw material ID' })
  @IsString()
  @IsOptional()
  rawMaterialId?: string;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'From location ID' })
  @IsString()
  @IsOptional()
  fromLocationId?: string;

  @ApiPropertyOptional({ description: 'To location ID' })
  @IsString()
  @IsOptional()
  toLocationId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Performed by user ID' })
  @IsString()
  @IsOptional()
  performedById?: string;
}

export class CreateInventoryLocationDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Location name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Location type', enum: ['WAREHOUSE', 'COLD_STORAGE', 'PRODUCTION_FLOOR', 'QC_LAB', 'FINISHED_GOODS', 'DISPATCH_CENTER'] })
  @IsString()
  @IsIn(['WAREHOUSE', 'COLD_STORAGE', 'PRODUCTION_FLOOR', 'QC_LAB', 'FINISHED_GOODS', 'DISPATCH_CENTER'])
  type: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Capacity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Temperature controlled' })
  @IsOptional()
  temperatureControlled?: boolean;

  @ApiPropertyOptional({ description: 'Min temperature (°C)' })
  @IsNumber()
  @IsOptional()
  minTemp?: number;

  @ApiPropertyOptional({ description: 'Max temperature (°C)' })
  @IsNumber()
  @IsOptional()
  maxTemp?: number;
}
