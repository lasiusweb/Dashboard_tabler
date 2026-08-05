import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto, UpdateRawMaterialDto } from '../../dto';

@ApiTags('raw-materials')
@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all raw materials' })
  @ApiResponse({ status: 200, description: 'Return all raw materials' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.rawMaterialsService.findAll(organizationId, {
      category,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get raw material statistics' })
  @ApiResponse({ status: 200, description: 'Return raw material statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.rawMaterialsService.getStats(organizationId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock raw materials' })
  @ApiResponse({ status: 200, description: 'Return low stock raw materials' })
  async getLowStock(@Query('organizationId') organizationId: string) {
    return this.rawMaterialsService.getLowStock(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get raw material by ID' })
  @ApiResponse({ status: 200, description: 'Return raw material by ID' })
  async findOne(@Param('id') id: string) {
    return this.rawMaterialsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create raw material' })
  @ApiResponse({ status: 201, description: 'Raw material created' })
  async create(@Body() body: CreateRawMaterialDto) {
    return this.rawMaterialsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update raw material' })
  @ApiResponse({ status: 200, description: 'Raw material updated' })
  async update(@Param('id') id: string, @Body() body: UpdateRawMaterialDto) {
    return this.rawMaterialsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete raw material' })
  @ApiResponse({ status: 200, description: 'Raw material deleted' })
  async remove(@Param('id') id: string) {
    return this.rawMaterialsService.remove(id);
  }
}
