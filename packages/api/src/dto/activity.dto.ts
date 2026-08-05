import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ACTIVITY_TYPES = [
  'NOTE',
  'CALL',
  'EMAIL',
  'MEETING',
  'TASK',
  'STAGE_CHANGE',
  'QC_TEST',
  'QC_APPROVAL',
  'QC_REJECTION',
  'BATCH_CREATED',
  'BATCH_COMPLETED',
  'DISPATCH_UPDATE',
  'DELIVERY_CONFIRMED',
  'PAYMENT_RECEIVED',
  'CROP_ADVISORY',
  'FIELD_VISIT',
  'COMPLIANCE_CHECK',
] as const;

export class CreateActivityDto {
  @ApiProperty({ description: 'Entity type' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Activity type', enum: ACTIVITY_TYPES })
  @IsString()
  @IsIn(ACTIVITY_TYPES as unknown as string[])
  type: string;

  @ApiProperty({ description: 'Activity title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Activity metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Contact ID' })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Party ID' })
  @IsString()
  @IsOptional()
  partyId?: string;
}
