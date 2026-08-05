import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppSettingDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Setting key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Setting value' })
  @IsObject()
  value: Record<string, any>;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAppSettingDto {
  @ApiPropertyOptional({ description: 'Setting value' })
  @IsObject()
  @IsOptional()
  value?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsString()
  @IsOptional()
  description?: string;
}
