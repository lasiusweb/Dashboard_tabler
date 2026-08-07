import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DistributorsService } from './distributors.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('DistributorsService', () => {
  let service: DistributorsService
  let prisma: {
    distributor: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      distributor: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
    }
    service = new DistributorsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('scopes to the organization through the party relation', async () => {
      prisma.distributor.findMany.mockResolvedValue([])
      await service.findAll('org-1', { territory: 'North', state: 'UP' })
      const arg = prisma.distributor.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        party: { organizationId: 'org-1' },
        territory: 'North',
        state: 'UP',
      })
      expect(arg.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('findOne', () => {
    it('returns the distributor when found', async () => {
      prisma.distributor.findUnique.mockResolvedValue({ id: 'd-1' })
      await expect(service.findOne('d-1')).resolves.toEqual({ id: 'd-1' })
      expect(prisma.distributor.findUnique).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        include: {
          party: true,
          fieldAgent: true,
          deliveries: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      })
    })

    it('throws NotFoundException when the distributor does not exist', async () => {
      prisma.distributor.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('throws BadRequestException when the party is already a distributor', async () => {
      prisma.distributor.findUnique.mockResolvedValue({ id: 'd-1' })
      await expect(service.create({ partyId: 'p-1', territory: 'North' })).rejects.toThrow(BadRequestException)
      expect(prisma.distributor.create).not.toHaveBeenCalled()
    })

    it('creates a distributor with sensible defaults', async () => {
      prisma.distributor.findUnique.mockResolvedValue(null)
      prisma.distributor.create.mockImplementation(({ data }: any) => ({ id: 'd-1', ...data }))
      const result = await service.create({ partyId: 'p-1', territory: 'North' })
      expect(result).toMatchObject({ isActive: true, coldStorageAvail: false })
      const arg = prisma.distributor.create.mock.calls[0][0]
      expect(arg.data).toMatchObject({
        territory: 'North',
        party: { connect: { id: 'p-1' } },
      })
    })

    it('connects a field agent when provided', async () => {
      prisma.distributor.findUnique.mockResolvedValue(null)
      prisma.distributor.create.mockResolvedValue({ id: 'd-1' })
      await service.create({ partyId: 'p-1', territory: 'North', fieldAgentId: 'u-1' })
      const arg = prisma.distributor.create.mock.calls[0][0]
      expect(arg.data.fieldAgent).toEqual({ connect: { id: 'u-1' } })
    })
  })

  describe('update', () => {
    it('throws NotFoundException when the distributor does not exist', async () => {
      prisma.distributor.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException)
    })

    it('updates an existing distributor', async () => {
      prisma.distributor.findUnique.mockResolvedValue({ id: 'd-1' })
      prisma.distributor.update.mockResolvedValue({ id: 'd-1' })
      await service.update('d-1', { territory: 'East' })
      expect(prisma.distributor.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { territory: 'East' },
        include: { party: true },
      })
    })
  })

  describe('remove', () => {
    it('throws NotFoundException when the distributor does not exist', async () => {
      prisma.distributor.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })

    it('deletes an existing distributor', async () => {
      prisma.distributor.findUnique.mockResolvedValue({ id: 'd-1' })
      prisma.distributor.delete.mockResolvedValue({ id: 'd-1' })
      await expect(service.remove('d-1')).resolves.toEqual({ id: 'd-1' })
      expect(prisma.distributor.delete).toHaveBeenCalledWith({ where: { id: 'd-1' } })
    })
  })

  describe('getStats', () => {
    it('aggregates counts, territory distribution, and average rating', async () => {
      prisma.distributor.count.mockResolvedValue(4)
      prisma.distributor.groupBy.mockResolvedValue([{ territory: 'North', _count: 3 }])
      prisma.distributor.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } })

      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 4,
        byTerritory: [{ territory: 'North', _count: 3 }],
        avgRating: 4.5,
      })
    })
  })
})
