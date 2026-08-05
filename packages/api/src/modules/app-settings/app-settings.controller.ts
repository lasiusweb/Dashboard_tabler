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
import { AppSettingsService } from './app-settings.service';
import { CreateAppSettingDto, UpdateAppSettingDto } from '../../dto/app-setting.dto';

@ApiTags('app-settings')
@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all app settings' })
  @ApiResponse({ status: 200, description: 'Return all app settings' })
  async findAll(@Query('organizationId') organizationId: string) {
    return this.appSettingsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get app setting by ID' })
  @ApiResponse({ status: 200, description: 'Return app setting by ID' })
  async findOne(@Param('id') id: string) {
    return this.appSettingsService.findOne(id);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get app setting by key' })
  @ApiResponse({ status: 200, description: 'Return app setting by key' })
  async findByKey(
    @Param('key') key: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.appSettingsService.findByKey(organizationId, key);
  }

  @Post()
  @ApiOperation({ summary: 'Create app setting' })
  @ApiResponse({ status: 201, description: 'App setting created' })
  async create(@Body() body: CreateAppSettingDto) {
    return this.appSettingsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update app setting' })
  @ApiResponse({ status: 200, description: 'App setting updated' })
  async update(@Param('id') id: string, @Body() body: UpdateAppSettingDto) {
    return this.appSettingsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete app setting' })
  @ApiResponse({ status: 200, description: 'App setting deleted' })
  async remove(@Param('id') id: string) {
    return this.appSettingsService.remove(id);
  }
}
