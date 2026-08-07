import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('OrganizationsService', () => {
  let service: OrganizationsService
  let prisma: {
    organization: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
    member: {
      findUnique: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
    invitation: {
      findUnique: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      organization: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      member: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
      invitation: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    }
    service = new OrganizationsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('returns organizations with member counts', async () => {
      prisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }])
      await expect(service.findAll()).resolves.toEqual([{ id: 'org-1' }])
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('returns the organization with members and invitations when found', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', members: [], invitations: [] })
      await expect(service.findOne('org-1')).resolves.toEqual({ id: 'org-1', members: [], invitations: [] })
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        include: { members: { include: { user: true } }, invitations: { include: { invitedBy: true } } },
      })
    })

    it('throws NotFoundException when the organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('creates an organization without an owner when no inviter is given', async () => {
      prisma.organization.create.mockResolvedValue({ id: 'org-1' })
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', members: [], invitations: [] })
      await expect(service.create({ name: 'Acme', slug: 'acme' })).resolves.toEqual({ id: 'org-1', members: [], invitations: [] })
      expect(prisma.organization.create).toHaveBeenCalledWith({ data: { name: 'Acme', slug: 'acme' }, include: { members: { include: { user: true } } } })
      expect(prisma.member.create).not.toHaveBeenCalled()
    })

    it('creates an owner membership when the inviter is not already a member', async () => {
      prisma.organization.create.mockResolvedValue({ id: 'org-1' })
      prisma.member.findUnique.mockResolvedValue(null)
      prisma.member.create.mockResolvedValue({ id: 'm-1' })
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', members: [], invitations: [] })
      await service.create({ name: 'Acme', slug: 'acme' }, 'u-1')
      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: 'org-1', userId: 'u-1' } },
      })
      expect(prisma.member.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', userId: 'u-1', role: 'owner' },
      })
    })

    it('skips owner membership when the inviter is already a member', async () => {
      prisma.organization.create.mockResolvedValue({ id: 'org-1' })
      prisma.member.findUnique.mockResolvedValue({ id: 'm-1' })
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', members: [], invitations: [] })
      await service.create({ name: 'Acme', slug: 'acme' }, 'u-1')
      expect(prisma.member.create).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('verifies the organization exists, then updates it', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.organization.update.mockResolvedValue({ id: 'org-1', name: 'Acme 2' })
      await expect(service.update('org-1', { name: 'Acme 2' })).resolves.toEqual({ id: 'org-1', name: 'Acme 2' })
      expect(prisma.organization.update).toHaveBeenCalledWith({ where: { id: 'org-1' }, data: { name: 'Acme 2' } })
    })

    it('throws NotFoundException when the organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('deletes an existing organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.organization.delete.mockResolvedValue({ id: 'org-1' })
      await expect(service.remove('org-1')).resolves.toEqual({ id: 'org-1' })
      expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } })
    })

    it('throws NotFoundException when the organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getMembers', () => {
    it('returns members ordered by creation date', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findMany.mockResolvedValue([{ id: 'm-1' }])
      await expect(service.getMembers('org-1')).resolves.toEqual([{ id: 'm-1' }])
      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      })
    })
  })

  describe('addMember', () => {
    it('throws BadRequestException when the user is already a member', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findUnique.mockResolvedValue({ id: 'm-1' })
      await expect(service.addMember('org-1', 'u-1')).rejects.toThrow(BadRequestException)
      expect(prisma.member.create).not.toHaveBeenCalled()
    })

    it('creates a member with the default role', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findUnique.mockResolvedValue(null)
      prisma.member.create.mockResolvedValue({ id: 'm-1' })
      await expect(service.addMember('org-1', 'u-1')).resolves.toEqual({ id: 'm-1' })
      expect(prisma.member.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', userId: 'u-1', role: 'member' },
        include: { user: true },
      })
    })

    it('creates a member with a custom role', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findUnique.mockResolvedValue(null)
      prisma.member.create.mockResolvedValue({ id: 'm-1' })
      await service.addMember('org-1', 'u-1', 'admin')
      expect(prisma.member.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', userId: 'u-1', role: 'admin' },
        include: { user: true },
      })
    })
  })

  describe('removeMember', () => {
    it('throws NotFoundException when the member is not in the organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findFirst.mockResolvedValue(null)
      await expect(service.removeMember('org-1', 'm-9')).rejects.toThrow(NotFoundException)
    })

    it('deletes the member when found', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findFirst.mockResolvedValue({ id: 'm-1' })
      prisma.member.delete.mockResolvedValue({ id: 'm-1' })
      await expect(service.removeMember('org-1', 'm-1')).resolves.toEqual({ id: 'm-1' })
      expect(prisma.member.findFirst).toHaveBeenCalledWith({ where: { id: 'm-1', organizationId: 'org-1' } })
      expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: 'm-1' } })
    })
  })

  describe('updateMemberRole', () => {
    it('throws NotFoundException when the member is not in the organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findFirst.mockResolvedValue(null)
      await expect(service.updateMemberRole('org-1', 'm-9', 'admin')).rejects.toThrow(NotFoundException)
    })

    it('updates the member role', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.member.findFirst.mockResolvedValue({ id: 'm-1' })
      prisma.member.update.mockResolvedValue({ id: 'm-1', role: 'admin' })
      await expect(service.updateMemberRole('org-1', 'm-1', 'admin')).resolves.toEqual({ id: 'm-1', role: 'admin' })
      expect(prisma.member.update).toHaveBeenCalledWith({ where: { id: 'm-1' }, data: { role: 'admin' }, include: { user: true } })
    })
  })

  describe('invite', () => {
    it('throws BadRequestException when an invitation is already pending', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.invitation.findUnique.mockResolvedValue({ id: 'i-1', status: 'pending' })
      await expect(service.invite('org-1', 'a@b.c', 'member', 'u-1')).rejects.toThrow(BadRequestException)
      expect(prisma.invitation.create).not.toHaveBeenCalled()
    })

    it('creates a pending invitation with a token and 7-day expiry', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.invitation.findUnique.mockResolvedValue(null)
      prisma.invitation.create.mockResolvedValue({ id: 'i-1' })
      const before = Date.now()
      await expect(service.invite('org-1', 'a@b.c', 'member', 'u-1')).resolves.toEqual({ id: 'i-1' })
      const arg = prisma.invitation.create.mock.calls[0][0]
      expect(arg.data.email).toBe('a@b.c')
      expect(arg.data.role).toBe('member')
      expect(arg.data.invitedById).toBe('u-1')
      expect(arg.data.status).toBe('pending')
      expect(typeof arg.data.token).toBe('string')
      expect(arg.data.token.length).toBeGreaterThan(0)
      const expiresAt = arg.data.expiresAt as Date
      expect(expiresAt).toBeInstanceOf(Date)
      expect(expiresAt.getTime()).toBeGreaterThan(before)
      expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000)
      expect(arg.include).toEqual({ invitedBy: true })
    })
  })

  describe('getInvitations', () => {
    it('returns invitations ordered by creation date', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.invitation.findMany.mockResolvedValue([{ id: 'i-1' }])
      await expect(service.getInvitations('org-1')).resolves.toEqual([{ id: 'i-1' }])
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { invitedBy: true },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('revokeInvitation', () => {
    it('throws NotFoundException when the invitation is not in the organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.invitation.findFirst.mockResolvedValue(null)
      await expect(service.revokeInvitation('org-1', 'i-9')).rejects.toThrow(NotFoundException)
    })

    it('deletes the invitation when found', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' })
      prisma.invitation.findFirst.mockResolvedValue({ id: 'i-1' })
      prisma.invitation.delete.mockResolvedValue({ id: 'i-1' })
      await expect(service.revokeInvitation('org-1', 'i-1')).resolves.toEqual({ id: 'i-1' })
      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({ where: { id: 'i-1', organizationId: 'org-1' } })
      expect(prisma.invitation.delete).toHaveBeenCalledWith({ where: { id: 'i-1' } })
    })
  })
})
