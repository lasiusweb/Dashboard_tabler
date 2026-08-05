import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'SKU (unique)' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Category', enum: ['BIO_FERTILIZER', 'BIO_PESTICIDE', 'BIO_FUNGICIDE', 'BIO_INSECTICIDE', 'ORGANIC_FERTILIZER', 'PLANT_GROWTH_REGULATOR', 'SOIL_CONDITIONER', 'SEED_TREATMENT'] })
  @IsString()
  @IsIn(['BIO_FERTILIZER', 'BIO_PESTICIDE', 'BIO_FUNGICIDE', 'BIO_INSECTICIDE', 'ORGANIC_FERTILIZER', 'PLANT_GROWTH_REGULATOR', 'SOIL_CONDITIONER', 'SEED_TREATMENT'])
  category: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Strain name' })
  @IsString()
  @IsOptional()
  strainName?: string;

  @ApiPropertyOptional({ description: 'Strain ID (culture collection)' })
  @IsString()
  @IsOptional()
  strainId?: string;

  @ApiPropertyOptional({ description: 'Formulation type', enum: ['LIQUID', 'POWDER', 'GRANULE', 'TABLET', 'SUSPENSION'] })
  @IsString()
  @IsOptional()
  formulationType?: string;

  @ApiPropertyOptional({ description: 'CFU per gram' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cfuPerGram?: number;

  @ApiPropertyOptional({ description: 'CFU per ml' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cfuPerMl?: number;

  @ApiPropertyOptional({ description: 'pH range (e.g., 6.0-7.5)' })
  @IsString()
  @IsOptional()
  phRange?: string;

  @ApiPropertyOptional({ description: 'Temperature range (e.g., 25-35°C)' })
  @IsString()
  @IsOptional()
  temperatureRange?: string;

  @ApiPropertyOptional({ description: 'Unit size' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitSize?: number;

  @ApiPropertyOptional({ description: 'Unit size unit', enum: ['GRAM', 'ML', 'KG', 'LITER'] })
  @IsString()
  @IsOptional()
  unitSizeUnit?: string;

  @ApiPropertyOptional({ description: 'Units per pack' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  unitsPerPack?: number;

  @ApiPropertyOptional({ description: 'Pack type', enum: ['BOTTLE', 'POUCH', 'BAG', 'BOX'] })
  @IsString()
  @IsOptional()
  packType?: string;

  @ApiPropertyOptional({ description: 'MRP per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrpPerUnit?: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'GST rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  gstRate?: number;

  @ApiPropertyOptional({ description: 'Shelf life in days' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  shelfLifeDays?: number;

  @ApiPropertyOptional({ description: 'FSSAI number' })
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional({ description: 'Organic certified' })
  @IsBoolean()
  @IsOptional()
  organicCertified?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'MRP per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrpPerUnit?: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'GST rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  gstRate?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
