import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('ActivitiesService', () => {
  let service: ActivitiesService
  let prisma: {
    activity: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      activity: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    }
    service = new ActivitiesService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('applies all filters and defaults the limit to 50', async () => {
      prisma.activity.findMany.mockResolvedValue([])
      await service.findAll({ organizationId: 'org-1', entityType: 'party', type: 'created' })
      const arg = prisma.activity.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({ organizationId: 'org-1', entityType: 'party', type: 'created' })
      expect(arg.take).toBe(50)
      expect(arg.orderBy).toEqual({ performedAt: 'desc' })
    })

    it('uses the provided limit', async () => {
      prisma.activity.findMany.mockResolvedValue([])
      await service.findAll({ limit: 10 })
      const arg = prisma.activity.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({})
      expect(arg.take).toBe(10)
    })
  })

  describe('findOne', () => {
    it('returns the activity when found', async () => {
      prisma.activity.findUnique.mockResolvedValue({ id: 'a-1' })
      await expect(service.findOne('a-1')).resolves.toEqual({ id: 'a-1' })
      expect(prisma.activity.findUnique).toHaveBeenCalledWith({
        where: { id: 'a-1' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          party: { select: { id: true, name: true } },
        },
      })
    })

    it('throws NotFoundException when the activity does not exist', async () => {
      prisma.activity.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('creates an activity with the provided data', async () => {
      const data = {
        entityType: 'party',
        entityId: 'p-1',
        type: 'created',
        title: 'Party created',
        organizationId: 'org-1',
        userId: 'u-1',
      }
      prisma.activity.create.mockResolvedValue({ id: 'a-1', ...data })
      await expect(service.create(data)).resolves.toEqual({ id: 'a-1', ...data })
      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          entityType: 'party',
          entityId: 'p-1',
          type: 'created',
          title: 'Party created',
          organizationId: 'org-1',
          description: undefined,
          metadata: undefined,
          userId: 'u-1',
          contactId: undefined,
          partyId: undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          party: { select: { id: true, name: true } },
        },
      })
    })
  })

  describe('remove', () => {
    it('deletes an existing activity', async () => {
      prisma.activity.findUnique.mockResolvedValue({ id: 'a-1' })
      prisma.activity.delete.mockResolvedValue({ id: 'a-1' })
      await expect(service.remove('a-1')).resolves.toEqual({ id: 'a-1' })
      expect(prisma.activity.delete).toHaveBeenCalledWith({ where: { id: 'a-1' } })
    })

    it('throws NotFoundException when the activity does not exist', async () => {
      prisma.activity.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })
})
