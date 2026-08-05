import { IsString, IsOptional, IsArray, IsIn, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VISIT_TYPES = [
  'CROP_ADVISORY',
  'PEST_DIAGNOSIS',
  'SOIL_TEST',
  'PRODUCT_DEMO',
  'COMPLAINT',
  'FOLLOW_UP',
] as const;

export class CreateFieldVisitDto {
  @ApiProperty({ description: 'Party ID' })
  @IsString()
  partyId: string;

  @ApiProperty({ description: 'Visitor (User) ID' })
  @IsString()
  visitedById: string;

  @ApiProperty({ description: 'Visit type', enum: VISIT_TYPES })
  @IsString()
  @IsIn(VISIT_TYPES as unknown as string[])
  visitType: string;

  @ApiProperty({ description: 'Scheduled date' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsString()
  @IsOptional()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsString()
  @IsOptional()
  longitude?: string;
}

export class UpdateFieldVisitDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Completed date' })
  @IsDateString()
  @IsOptional()
  completedDate?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Findings' })
  @IsString()
  @IsOptional()
  findings?: string;

  @ApiPropertyOptional({ description: 'Recommendations' })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Photos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
