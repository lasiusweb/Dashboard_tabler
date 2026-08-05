import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Organization slug (unique)' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: 'Organization name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class CreateMemberDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Member role',
    enum: ['owner', 'admin', 'plant_manager', 'qc_manager', 'sales_manager', 'field_agent', 'accountant', 'viewer'],
    default: 'member',
  })
  @IsString()
  @IsIn(['owner', 'admin', 'plant_manager', 'qc_manager', 'sales_manager', 'field_agent', 'accountant', 'viewer', 'member'])
  @IsOptional()
  role?: string;
}

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email to invite' })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'Invited role',
    enum: ['owner', 'admin', 'plant_manager', 'qc_manager', 'sales_manager', 'field_agent', 'accountant', 'viewer', 'member'],
    default: 'member',
  })
  @IsString()
  @IsIn(['owner', 'admin', 'plant_manager', 'qc_manager', 'sales_manager', 'field_agent', 'accountant', 'viewer', 'member'])
  @IsOptional()
  role?: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'User ID of the inviter' })
  @IsString()
  invitedById: string;
}
