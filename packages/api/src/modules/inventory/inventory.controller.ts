import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto, CreateInventoryLocationDto } from '../../dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'Return all inventory items' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('locationId') locationId?: string,
    @Query('productId') productId?: string,
    @Query('rawMaterialId') rawMaterialId?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.inventoryService.findAll(organizationId, {
      locationId,
      productId,
      rawMaterialId,
      lowStock,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Return inventory statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.inventoryService.getInventoryStats(organizationId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiResponse({ status: 200, description: 'Return low stock items' })
  async getLowStock(@Query('organizationId') organizationId: string) {
    return this.inventoryService.getLowStockItems(organizationId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get inventory movements' })
  @ApiResponse({ status: 200, description: 'Return inventory movements' })
  async getMovements(
    @Query('organizationId') organizationId: string,
    @Query('productId') productId?: string,
    @Query('rawMaterialId') rawMaterialId?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.getMovements(organizationId, {
      productId,
      rawMaterialId,
      type,
    });
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get inventory locations' })
  @ApiResponse({ status: 200, description: 'Return inventory locations' })
  async getLocations(@Query('organizationId') organizationId: string) {
    return this.inventoryService.getLocations(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Return inventory item by ID' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Create inventory movement' })
  @ApiResponse({ status: 201, description: 'Inventory movement created' })
  async createMovement(@Body() body: CreateInventoryMovementDto) {
    return this.inventoryService.createMovement(body);
  }

  @Post('locations')
  @ApiOperation({ summary: 'Create inventory location' })
  @ApiResponse({ status: 201, description: 'Inventory location created' })
  async createLocation(@Body() body: CreateInventoryLocationDto) {
    return this.inventoryService.createLocation(body);
  }
}
