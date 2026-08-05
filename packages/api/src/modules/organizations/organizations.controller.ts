import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateMemberDto,
  CreateInvitationDto,
} from '../../dto/organization.dto';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Return all organizations' })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Return organization with members and invitations' })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(@Body() body: CreateOrganizationDto) {
    return this.organizationsService.create(
      { name: body.name, slug: body.slug, logoUrl: body.logoUrl },
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(@Param('id') id: string, @Body() body: UpdateOrganizationDto) {
    return this.organizationsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  async remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members of an organization' })
  @ApiResponse({ status: 200, description: 'Return all members with user info' })
  async getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  @ApiResponse({ status: 201, description: 'Member added' })
  async addMember(@Param('id') id: string, @Body() body: CreateMemberDto) {
    return this.organizationsService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.organizationsService.removeMember(id, memberId);
  }

  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.organizationsService.updateMemberRole(id, memberId, body.role);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Create invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  async invite(@Param('id') id: string, @Body() body: CreateInvitationDto) {
    return this.organizationsService.invite(
      id,
      body.email,
      body.role || 'member',
      body.invitedById,
    );
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get invitations for an organization' })
  @ApiResponse({ status: 200, description: 'Return all invitations' })
  async getInvitations(@Param('id') id: string) {
    return this.organizationsService.getInvitations(id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(@Param('id') id: string, @Param('invitationId') invitationId: string) {
    return this.organizationsService.revokeInvitation(id, invitationId);
  }
}
