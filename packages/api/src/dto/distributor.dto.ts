import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDistributorDto {
  @ApiProperty({ description: 'Party ID (unique)' })
  @IsString()
  partyId: string;

  @ApiProperty({ description: 'Territory' })
  @IsString()
  territory: string;

  @ApiPropertyOptional({ description: 'Region' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'District' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Target quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetQuantity?: number;

  @ApiPropertyOptional({ description: 'Current quantity', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentQuantity?: number;

  @ApiPropertyOptional({ description: 'Commission rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Cold storage available', default: false })
  @IsBoolean()
  @IsOptional()
  coldStorageAvail?: boolean;

  @ApiPropertyOptional({ description: 'Field agent user ID' })
  @IsString()
  @IsOptional()
  fieldAgentId?: string;

  @ApiPropertyOptional({ description: 'Rating (0-5)' })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDistributorDto {
  @ApiPropertyOptional({ description: 'Territory' })
  @IsString()
  @IsOptional()
  territory?: string;

  @ApiPropertyOptional({ description: 'Region' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'District' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Target quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetQuantity?: number;

  @ApiPropertyOptional({ description: 'Current quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentQuantity?: number;

  @ApiPropertyOptional({ description: 'Commission rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Cold storage available' })
  @IsBoolean()
  @IsOptional()
  coldStorageAvail?: boolean;

  @ApiPropertyOptional({ description: 'Field agent user ID' })
  @IsString()
  @IsOptional()
  fieldAgentId?: string;

  @ApiPropertyOptional({ description: 'Rating (0-5)' })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
