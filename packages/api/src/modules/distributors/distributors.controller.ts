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
import { DistributorsService } from './distributors.service';
import { CreateDistributorDto, UpdateDistributorDto } from '../../dto';

@ApiTags('distributors')
@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all distributors' })
  @ApiResponse({ status: 200, description: 'Return all distributors' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('territory') territory?: string,
    @Query('state') state?: string,
  ) {
    return this.distributorsService.findAll(organizationId, {
      territory,
      state,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get distributor statistics' })
  @ApiResponse({ status: 200, description: 'Return distributor statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.distributorsService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get distributor by ID' })
  @ApiResponse({ status: 200, description: 'Return distributor by ID' })
  async findOne(@Param('id') id: string) {
    return this.distributorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create distributor' })
  @ApiResponse({ status: 201, description: 'Distributor created' })
  async create(@Body() body: CreateDistributorDto) {
    return this.distributorsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update distributor' })
  @ApiResponse({ status: 200, description: 'Distributor updated' })
  async update(@Param('id') id: string, @Body() body: UpdateDistributorDto) {
    return this.distributorsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete distributor' })
  @ApiResponse({ status: 200, description: 'Distributor deleted' })
  async remove(@Param('id') id: string) {
    return this.distributorsService.remove(id);
  }
}
