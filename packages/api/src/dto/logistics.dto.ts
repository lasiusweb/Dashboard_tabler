import { IsString, IsOptional, IsNumber, Min, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Sales order ID' })
  @IsString()
  @IsOptional()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Delivery ID' })
  @IsString()
  @IsOptional()
  deliveryId?: string;

  @ApiPropertyOptional({ description: 'Vehicle ID' })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateShipmentDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TemperatureLogEntryDto {
  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Temperature (°C)' })
  @IsNumber()
  temperature: number;
}

export class GPSLogEntryDto {
  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  lng: number;
}

export class CreateVehicleDto {
  @ApiProperty({ description: 'Registration number' })
  @IsString()
  registrationNumber: string;

  @ApiProperty({ description: 'Vehicle type', enum: ['TRUCK', 'VAN', 'TEMPO', 'BIKE', 'COLD_CHAIN_VEHICLE'] })
  @IsString()
  @IsIn(['TRUCK', 'VAN', 'TEMPO', 'BIKE', 'COLD_CHAIN_VEHICLE'])
  type: string;

  @ApiPropertyOptional({ description: 'Capacity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Capacity unit' })
  @IsString()
  @IsOptional()
  capacityUnit?: string;

  @ApiPropertyOptional({ description: 'Has cold chain' })
  @IsOptional()
  hasColdChain?: boolean;

  @ApiPropertyOptional({ description: 'Min temperature (°C)' })
  @IsNumber()
  @IsOptional()
  minTemp?: number;

  @ApiPropertyOptional({ description: 'Max temperature (°C)' })
  @IsNumber()
  @IsOptional()
  maxTemp?: number;

  @ApiPropertyOptional({ description: 'GPS tracking ID' })
  @IsString()
  @IsOptional()
  gpsTrackingId?: string;

  @ApiPropertyOptional({ description: 'Driver name' })
  @IsString()
  @IsOptional()
  driverName?: string;

  @ApiPropertyOptional({ description: 'Driver phone' })
  @IsString()
  @IsOptional()
  driverPhone?: string;
}
