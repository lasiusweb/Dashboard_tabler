import { IsString, IsOptional, IsNumber, Min, IsIn, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplianceRecordDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Party ID' })
  @IsString()
  @IsOptional()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: 'Certificate type', enum: ['FSSAI', 'ORGANIC', 'BIS', 'ISO', 'GST_REGISTRATION', 'TRADE_LICENSE', 'MSME'] })
  @IsString()
  @IsIn(['FSSAI', 'ORGANIC', 'BIS', 'ISO', 'GST_REGISTRATION', 'TRADE_LICENSE', 'MSME'])
  certType: string;

  @ApiProperty({ description: 'Certificate number' })
  @IsString()
  certificateNumber: string;

  @ApiPropertyOptional({ description: 'Issued by' })
  @IsString()
  @IsOptional()
  issuedBy?: string;

  @ApiProperty({ description: 'Issued date' })
  issuedDate: Date;

  @ApiProperty({ description: 'Expiry date' })
  expiryDate: Date;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateComplianceRecordDto {
  @ApiPropertyOptional({ description: 'Status', enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RenewComplianceRecordDto {
  @ApiProperty({ description: 'New certificate number' })
  @IsString()
  newCertificateNumber: string;

  @ApiProperty({ description: 'New expiry date' })
  newExpiryDate: Date;

  @ApiPropertyOptional({ description: 'Issued by' })
  @IsString()
  @IsOptional()
  issuedBy?: string;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsString()
  @IsOptional()
  documentUrl?: string;
}

export class SuspendRevokeComplianceRecordDto {
  @ApiPropertyOptional({ description: 'Reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}
