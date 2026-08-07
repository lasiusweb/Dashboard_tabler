import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PartiesService } from './parties.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('PartiesService', () => {
  let service: PartiesService
  let prisma: {
    party: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
    contact: {
      count: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      deleteMany: ReturnType<typeof vi.fn>
    }
    salesOrder: { count: ReturnType<typeof vi.fn> }
    purchaseOrder: { count: ReturnType<typeof vi.fn> }
    partyOwnership: { deleteMany: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      party: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      contact: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      salesOrder: { count: vi.fn() },
      purchaseOrder: { count: vi.fn() },
      partyOwnership: { deleteMany: vi.fn() },
    }
    service = new PartiesService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('queries by organizationId and applies the type filter when provided', async () => {
      prisma.party.findMany.mockResolvedValue([])
      await service.findAll('org-1', { type: 'customer' })
      expect(prisma.party.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', type: 'customer' },
        include: { contacts: true, _count: { select: { contacts: true, salesOrders: true, purchaseOrders: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('omits the type filter when not provided', async () => {
      prisma.party.findMany.mockResolvedValue([])
      await service.findAll('org-1')
      expect(prisma.party.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { contacts: true, _count: { select: { contacts: true, salesOrders: true, purchaseOrders: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('returns the party with relations when found', async () => {
      const party = { id: 'p-1' }
      prisma.party.findUnique.mockResolvedValue(party)
      await expect(service.findOne('p-1')).resolves.toEqual(party)
      expect(prisma.party.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        include: {
          contacts: true,
          ownerships: { include: { user: { select: { id: true, name: true, email: true } } } },
          organization: { select: { id: true, name: true } },
        },
      })
    })

    it('throws NotFoundException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('creates a party with contacts included', async () => {
      const data = { name: 'GreenFarm Co-op', type: 'customer', organizationId: 'org-1' }
      prisma.party.create.mockResolvedValue({ id: 'p-1', ...data })
      await expect(service.create(data)).resolves.toEqual({ id: 'p-1', ...data })
      expect(prisma.party.create).toHaveBeenCalledWith({ data, include: { contacts: true } })
    })
  })

  describe('update', () => {
    it('verifies the party exists, then updates it', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.party.update.mockResolvedValue({ id: 'p-1', name: 'Updated' })
      await expect(service.update('p-1', { name: 'Updated' })).resolves.toEqual({ id: 'p-1', name: 'Updated' })
      expect(prisma.party.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { name: 'Updated' },
        include: { contacts: true },
      })
    })

    it('throws NotFoundException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('deletes the party and its related rows when no orders exist', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.salesOrder.count.mockResolvedValue(0)
      prisma.purchaseOrder.count.mockResolvedValue(0)
      prisma.party.delete.mockResolvedValue({ id: 'p-1' })
      await expect(service.remove('p-1')).resolves.toEqual({ id: 'p-1' })
      expect(prisma.contact.deleteMany).toHaveBeenCalledWith({ where: { partyId: 'p-1' } })
      expect(prisma.partyOwnership.deleteMany).toHaveBeenCalledWith({ where: { partyId: 'p-1' } })
      expect(prisma.party.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } })
    })

    it('rejects deletion when the party has sales orders', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.salesOrder.count.mockResolvedValue(3)
      await expect(service.remove('p-1')).rejects.toThrow(BadRequestException)
      expect(prisma.party.delete).not.toHaveBeenCalled()
    })

    it('rejects deletion when the party has purchase orders', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.salesOrder.count.mockResolvedValue(0)
      prisma.purchaseOrder.count.mockResolvedValue(2)
      await expect(service.remove('p-1')).rejects.toThrow(BadRequestException)
      expect(prisma.party.delete).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getStats', () => {
    it('aggregates party counts by type and returns contact totals', async () => {
      prisma.party.count.mockResolvedValue(5)
      prisma.party.groupBy.mockResolvedValue([
        { type: 'customer', _count: 3 },
        { type: 'vendor', _count: 2 },
      ])
      prisma.contact.count.mockResolvedValue(8)
      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 5,
        byType: [
          { type: 'customer', _count: 3 },
          { type: 'vendor', _count: 2 },
        ],
        totalContacts: 8,
      })
      expect(prisma.contact.count).toHaveBeenCalledWith({ where: { party: { organizationId: 'org-1' } } })
    })
  })

  describe('getContacts', () => {
    it('returns contacts ordered by primary then first name', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.contact.findMany.mockResolvedValue([{ id: 'c-1' }])
      await expect(service.getContacts('p-1')).resolves.toEqual([{ id: 'c-1' }])
      expect(prisma.contact.findMany).toHaveBeenCalledWith({
        where: { partyId: 'p-1' },
        orderBy: [{ isPrimary: 'desc' }, { firstName: 'asc' }],
      })
    })

    it('throws NotFoundException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.getContacts('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('addContact', () => {
    it('creates a contact connected to the party', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.contact.create.mockResolvedValue({ id: 'c-1' })
      await expect(service.addContact('p-1', { firstName: 'Anna' })).resolves.toEqual({ id: 'c-1' })
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: { firstName: 'Anna', party: { connect: { id: 'p-1' } } },
      })
    })

    it('throws NotFoundException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.addContact('missing', { firstName: 'Anna' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateContact', () => {
    it('updates an existing contact', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' })
      prisma.contact.update.mockResolvedValue({ id: 'c-1', firstName: 'Bob' })
      await expect(service.updateContact('c-1', { firstName: 'Bob' })).resolves.toEqual({ id: 'c-1', firstName: 'Bob' })
      expect(prisma.contact.update).toHaveBeenCalledWith({ where: { id: 'c-1' }, data: { firstName: 'Bob' } })
    })

    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null)
      await expect(service.updateContact('missing', {})).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeContact', () => {
    it('deletes an existing contact', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' })
      prisma.contact.delete.mockResolvedValue({ id: 'c-1' })
      await expect(service.removeContact('c-1')).resolves.toEqual({ id: 'c-1' })
      expect(prisma.contact.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } })
    })

    it('throws NotFoundException when the contact does not exist', async () => {
      prisma.contact.findUnique.mockResolvedValue(null)
      await expect(service.removeContact('missing')).rejects.toThrow(NotFoundException)
    })
  })
})
