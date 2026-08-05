import { IsString, IsOptional, IsNumber, IsBoolean, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRawMaterialDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Raw material name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Category', enum: ['STRAIN', 'MEDIA', 'PACKAGING', 'CHEMICAL', 'LABEL'] })
  @IsString()
  @IsIn(['STRAIN', 'MEDIA', 'PACKAGING', 'CHEMICAL', 'LABEL'])
  category: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Strain name' })
  @IsString()
  @IsOptional()
  strainName?: string;

  @ApiPropertyOptional({ description: 'Culture collection identifier' })
  @IsString()
  @IsOptional()
  cultureCollection?: string;

  @ApiPropertyOptional({ description: 'Strain type', enum: ['BACTERIA', 'FUNGUS', 'ALGAE'] })
  @IsString()
  @IsOptional()
  strainType?: string;

  @ApiPropertyOptional({ description: 'Current stock', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiProperty({ description: 'Unit', enum: ['GRAM', 'ML', 'KG', 'LITER', 'PIECE'] })
  @IsString()
  @IsIn(['GRAM', 'ML', 'KG', 'LITER', 'PIECE'])
  unit: string;

  @ApiProperty({ description: 'Reorder level' })
  @IsNumber()
  @Min(0)
  reorderLevel: number;

  @ApiProperty({ description: 'Reorder quantity' })
  @IsNumber()
  @Min(0)
  reorderQuantity: number;

  @ApiPropertyOptional({ description: 'Maximum stock' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'Storage condition', enum: ['ROOM_TEMP', 'COLD_STORAGE', 'FREEZER'] })
  @IsString()
  @IsOptional()
  storageCondition?: string;

  @ApiPropertyOptional({ description: 'Minimum temperature (°C)' })
  @IsNumber()
  @IsOptional()
  minTemp?: number;

  @ApiPropertyOptional({ description: 'Maximum temperature (°C)' })
  @IsNumber()
  @IsOptional()
  maxTemp?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRawMaterialDto {
  @ApiPropertyOptional({ description: 'Raw material name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Strain name' })
  @IsString()
  @IsOptional()
  strainName?: string;

  @ApiPropertyOptional({ description: 'Culture collection identifier' })
  @IsString()
  @IsOptional()
  cultureCollection?: string;

  @ApiPropertyOptional({ description: 'Strain type' })
  @IsString()
  @IsOptional()
  strainType?: string;

  @ApiPropertyOptional({ description: 'Current stock' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional({ description: 'Unit' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Reorder level' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum stock' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'Storage condition' })
  @IsString()
  @IsOptional()
  storageCondition?: string;

  @ApiPropertyOptional({ description: 'Minimum temperature (°C)' })
  @IsNumber()
  @IsOptional()
  minTemp?: number;

  @ApiPropertyOptional({ description: 'Maximum temperature (°C)' })
  @IsNumber()
  @IsOptional()
  maxTemp?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
