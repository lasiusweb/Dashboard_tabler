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
import { PartiesService } from './parties.service';
import {
  CreatePartyDto,
  UpdatePartyDto,
  CreateContactDto,
  UpdateContactDto,
} from '../../dto';

@ApiTags('parties')
@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all parties' })
  @ApiResponse({ status: 200, description: 'Return all parties' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('type') type?: string,
  ) {
    return this.partiesService.findAll(organizationId, { type });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get party statistics' })
  @ApiResponse({ status: 200, description: 'Return party statistics' })
  async getStats(@Query('organizationId') organizationId: string) {
    return this.partiesService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get party by ID' })
  @ApiResponse({ status: 200, description: 'Return party by ID' })
  async findOne(@Param('id') id: string) {
    return this.partiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create party' })
  @ApiResponse({ status: 201, description: 'Party created' })
  async create(@Body() body: CreatePartyDto) {
    return this.partiesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update party' })
  @ApiResponse({ status: 200, description: 'Party updated' })
  async update(@Param('id') id: string, @Body() body: UpdatePartyDto) {
    return this.partiesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete party' })
  @ApiResponse({ status: 200, description: 'Party deleted' })
  async remove(@Param('id') id: string) {
    return this.partiesService.remove(id);
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Get contacts for a party' })
  @ApiResponse({ status: 200, description: 'Return contacts for a party' })
  async getContacts(@Param('id') id: string) {
    return this.partiesService.getContacts(id);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contact to party' })
  @ApiResponse({ status: 201, description: 'Contact added' })
  async addContact(
    @Param('id') id: string,
    @Body() body: CreateContactDto,
  ) {
    return this.partiesService.addContact(id, body);
  }

  @Put('contacts/:contactId')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() body: UpdateContactDto,
  ) {
    return this.partiesService.updateContact(contactId, body);
  }

  @Delete('contacts/:contactId')
  @ApiOperation({ summary: 'Remove contact' })
  @ApiResponse({ status: 200, description: 'Contact removed' })
  async removeContact(@Param('contactId') contactId: string) {
    return this.partiesService.removeContact(contactId);
  }
}
