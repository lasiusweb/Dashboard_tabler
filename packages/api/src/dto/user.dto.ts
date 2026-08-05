import { IsString, IsOptional, IsIn, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Department', enum: ['PRODUCTION', 'QC', 'SALES', 'LOGISTICS', 'FINANCE', 'ADMIN'] })
  @IsString()
  @IsIn(['PRODUCTION', 'QC', 'SALES', 'LOGISTICS', 'FINANCE', 'ADMIN'])
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Plant assignment' })
  @IsString()
  @IsOptional()
  plant?: string;

  @ApiPropertyOptional({ description: 'Shift', enum: ['MORNING', 'AFTERNOON', 'NIGHT'] })
  @IsString()
  @IsIn(['MORNING', 'AFTERNOON', 'NIGHT'])
  @IsOptional()
  shift?: string;

  @ApiPropertyOptional({ description: 'Designation' })
  @IsString()
  @IsOptional()
  designation?: string;
}
