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
import { FieldVisitsService } from './field-visits.service';
import { CreateFieldVisitDto, UpdateFieldVisitDto } from '../../dto/field-visit.dto';

@ApiTags('field-visits')
@Controller('field-visits')
export class FieldVisitsController {
  constructor(private readonly fieldVisitsService: FieldVisitsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all field visits' })
  @ApiResponse({ status: 200, description: 'Return all field visits' })
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('visitedById') visitedById?: string,
    @Query('status') status?: string,
    @Query('visitType') visitType?: string,
  ) {
    return this.fieldVisitsService.findAll({
      organizationId,
      visitedById,
      status,
      visitType,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get field visit statistics' })
  @ApiResponse({ status: 200, description: 'Return field visit statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.fieldVisitsService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field visit by ID' })
  @ApiResponse({ status: 200, description: 'Return field visit by ID' })
  async findOne(@Param('id') id: string) {
    return this.fieldVisitsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create field visit' })
  @ApiResponse({ status: 201, description: 'Field visit created' })
  async create(@Body() body: CreateFieldVisitDto) {
    return this.fieldVisitsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update field visit' })
  @ApiResponse({ status: 200, description: 'Field visit updated' })
  async update(@Param('id') id: string, @Body() body: UpdateFieldVisitDto) {
    return this.fieldVisitsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete field visit' })
  @ApiResponse({ status: 200, description: 'Field visit deleted' })
  async remove(@Param('id') id: string) {
    return this.fieldVisitsService.remove(id);
  }
}
