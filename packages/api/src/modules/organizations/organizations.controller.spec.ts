import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from './organizations.service'

describe('OrganizationsController', () => {
  let controller: OrganizationsController
  let service: {
    findAll: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    getMembers: ReturnType<typeof vi.fn>
    addMember: ReturnType<typeof vi.fn>
    removeMember: ReturnType<typeof vi.fn>
    updateMemberRole: ReturnType<typeof vi.fn>
    invite: ReturnType<typeof vi.fn>
    getInvitations: ReturnType<typeof vi.fn>
    revokeInvitation: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      invite: vi.fn(),
      getInvitations: vi.fn(),
      revokeInvitation: vi.fn(),
    }
    controller = new OrganizationsController(service as unknown as OrganizationsService)
  })

  describe('findAll', () => {
    it('delegates to the service', async () => {
      service.findAll.mockResolvedValue([])
      await expect(controller.findAll()).resolves.toEqual([])
      expect(service.findAll).toHaveBeenCalledWith()
    })
  })

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      service.findOne.mockResolvedValue({ id: 'org-1' })
      await expect(controller.findOne('org-1')).resolves.toEqual({ id: 'org-1' })
      expect(service.findOne).toHaveBeenCalledWith('org-1')
    })
  })

  describe('create', () => {
    it('maps name, slug and logoUrl to the service', async () => {
      const body = { name: 'FirstCrop', slug: 'firstcrop', logoUrl: 'logo.png' }
      service.create.mockResolvedValue({ id: 'org-1', ...body })
      await expect(controller.create(body)).resolves.toEqual({ id: 'org-1', ...body })
      expect(service.create).toHaveBeenCalledWith({
        name: 'FirstCrop',
        slug: 'firstcrop',
        logoUrl: 'logo.png',
      })
    })

    it('does not forward extra fields', async () => {
      service.create.mockResolvedValue({ id: 'org-1' })
      await controller.create({ name: 'X', slug: 'x', extra: 'ignored' } as never)
      expect(service.create).toHaveBeenCalledWith({ name: 'X', slug: 'x', logoUrl: undefined })
    })
  })

  describe('update', () => {
    it('delegates id and body to the service', async () => {
      const body = { name: 'Renamed' }
      service.update.mockResolvedValue({ id: 'org-1', ...body })
      await expect(controller.update('org-1', body)).resolves.toEqual({ id: 'org-1', ...body })
      expect(service.update).toHaveBeenCalledWith('org-1', body)
    })
  })

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      service.remove.mockResolvedValue({ id: 'org-1' })
      await expect(controller.remove('org-1')).resolves.toEqual({ id: 'org-1' })
      expect(service.remove).toHaveBeenCalledWith('org-1')
    })
  })

  describe('getMembers', () => {
    it('delegates to the service with the id', async () => {
      service.getMembers.mockResolvedValue([])
      await expect(controller.getMembers('org-1')).resolves.toEqual([])
      expect(service.getMembers).toHaveBeenCalledWith('org-1')
    })
  })

  describe('addMember', () => {
    it('passes userId and role from the body', async () => {
      service.addMember.mockResolvedValue({ id: 'm-1' })
      await expect(controller.addMember('org-1', { userId: 'u-1', role: 'admin' })).resolves.toEqual({ id: 'm-1' })
      expect(service.addMember).toHaveBeenCalledWith('org-1', 'u-1', 'admin')
    })
  })

  describe('removeMember', () => {
    it('delegates org id and member id to the service', async () => {
      service.removeMember.mockResolvedValue({ ok: true })
      await expect(controller.removeMember('org-1', 'm-1')).resolves.toEqual({ ok: true })
      expect(service.removeMember).toHaveBeenCalledWith('org-1', 'm-1')
    })
  })

  describe('updateMemberRole', () => {
    it('passes the role from the body', async () => {
      service.updateMemberRole.mockResolvedValue({ id: 'm-1' })
      await expect(controller.updateMemberRole('org-1', 'm-1', { role: 'owner' })).resolves.toEqual({ id: 'm-1' })
      expect(service.updateMemberRole).toHaveBeenCalledWith('org-1', 'm-1', 'owner')
    })
  })

  describe('invite', () => {
    it('passes email, role and invitedById from the body', async () => {
      service.invite.mockResolvedValue({ id: 'inv-1' })
      await expect(controller.invite('org-1', { email: 'a@b.com', role: 'admin', invitedById: 'u-1' } as never)).resolves.toEqual({ id: 'inv-1' })
      expect(service.invite).toHaveBeenCalledWith('org-1', 'a@b.com', 'admin', 'u-1')
    })

    it('defaults role to member when omitted', async () => {
      service.invite.mockResolvedValue({ id: 'inv-1' })
      await controller.invite('org-1', { email: 'a@b.com' } as never)
      expect(service.invite).toHaveBeenCalledWith('org-1', 'a@b.com', 'member', undefined)
    })
  })

  describe('getInvitations', () => {
    it('delegates to the service with the id', async () => {
      service.getInvitations.mockResolvedValue([])
      await expect(controller.getInvitations('org-1')).resolves.toEqual([])
      expect(service.getInvitations).toHaveBeenCalledWith('org-1')
    })
  })

  describe('revokeInvitation', () => {
    it('delegates org id and invitation id to the service', async () => {
      service.revokeInvitation.mockResolvedValue({ ok: true })
      await expect(controller.revokeInvitation('org-1', 'inv-1')).resolves.toEqual({ ok: true })
      expect(service.revokeInvitation).toHaveBeenCalledWith('org-1', 'inv-1')
    })
  })
})
