import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from '../../dto/activity.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities' })
  @ApiResponse({ status: 200, description: 'Return all activities' })
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    return this.activitiesService.findAll({
      organizationId,
      entityType,
      entityId,
      type,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Return activity by ID' })
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create activity' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(@Body() body: CreateActivityDto) {
    return this.activitiesService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  async remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
