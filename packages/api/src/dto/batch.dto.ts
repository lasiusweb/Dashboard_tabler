import { IsString, IsOptional, IsNumber, Min, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Planned quantity' })
  @IsNumber()
  @Min(0.01)
  plannedQuantity: number;

  @ApiProperty({ description: 'Unit', enum: ['GRAM', 'ML', 'KG', 'LITER'] })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Expiry date' })
  expiryDate: Date;

  @ApiPropertyOptional({ description: 'Incubation temperature (°C)' })
  @IsNumber()
  @IsOptional()
  incubationTemp?: number;

  @ApiPropertyOptional({ description: 'Incubation pH' })
  @IsNumber()
  @IsOptional()
  incubationPH?: number;

  @ApiPropertyOptional({ description: 'Incubation time in hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  incubationTimeHours?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsString()
  @IsIn(['PLANNED', 'IN_PROGRESS', 'FERMENTATION', 'PROCESSING', 'QC_PENDING', 'QC_PASSED', 'QC_REJECTED', 'PACKAGING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'EXPIRED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Actual quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualQuantity?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteProductionDto {
  @ApiProperty({ description: 'Actual quantity produced' })
  @IsNumber()
  @Min(0)
  actualQuantity: number;
}

export class UpdateQCStatusDto {
  @ApiProperty({ description: 'QC status', enum: ['PASS', 'FAIL', 'CONDITIONAL_PASS'] })
  @IsString()
  @IsIn(['PASS', 'FAIL', 'CONDITIONAL_PASS'])
  qcStatus: string;

  @ApiPropertyOptional({ description: 'Certificate number' })
  @IsString()
  @IsOptional()
  certificateNumber?: string;
}

export class PackageBatchDto {
  @ApiProperty({ description: 'Packaging type' })
  @IsString()
  packagingType: string;

  @ApiProperty({ description: 'Units produced' })
  @IsNumber()
  @Min(1)
  unitsProduced: number;

  @ApiPropertyOptional({ description: 'Packaging date' })
  @IsOptional()
  packagingDate?: Date;
}
