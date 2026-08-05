import { IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQCTestDto {
  @ApiProperty({ description: 'Batch ID' })
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Test type', enum: ['CFU_COUNT', 'PH_LEVEL', 'MOISTURE', 'CONTAMINATION', 'VISCOSITY', 'COLOR', 'ODOR', 'SPECIFIC_GRAVITY', 'HEAVY_METALS', 'PATHOGEN_TEST'] })
  @IsString()
  @IsIn(['CFU_COUNT', 'PH_LEVEL', 'MOISTURE', 'CONTAMINATION', 'VISCOSITY', 'COLOR', 'ODOR', 'SPECIFIC_GRAVITY', 'HEAVY_METALS', 'PATHOGEN_TEST'])
  testType: string;

  @ApiPropertyOptional({ description: 'Test method' })
  @IsString()
  @IsOptional()
  testMethod?: string;

  @ApiProperty({ description: 'Parameter being tested' })
  @IsString()
  parameter: string;

  @ApiPropertyOptional({ description: 'Expected value' })
  @IsString()
  @IsOptional()
  expectedValue?: string;

  @ApiPropertyOptional({ description: 'Unit' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Lab name' })
  @IsString()
  @IsOptional()
  labName?: string;
}

export class UpdateQCTestDto {
  @ApiPropertyOptional({ description: 'Actual value' })
  @IsString()
  @IsOptional()
  actualValue?: string;

  @ApiPropertyOptional({ description: 'Result', enum: ['PASS', 'FAIL', 'CONDITIONAL_PASS', 'INCONCLUSIVE'] })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteQCTestDto {
  @ApiProperty({ description: 'Actual measured value' })
  @IsString()
  actualValue: string;

  @ApiProperty({ description: 'Result', enum: ['PASS', 'FAIL', 'CONDITIONAL_PASS', 'INCONCLUSIVE'] })
  @IsString()
  @IsIn(['PASS', 'FAIL', 'CONDITIONAL_PASS', 'INCONCLUSIVE'])
  result: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
