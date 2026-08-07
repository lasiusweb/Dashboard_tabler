import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@firstcrop/db'
import { FieldVisitsService } from './field-visits.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('FieldVisitsService', () => {
  let service: FieldVisitsService
  let prisma: {
    fieldVisit: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
    party: { findUnique: ReturnType<typeof vi.fn> }
    user: { findUnique: ReturnType<typeof vi.fn> }
  }

  beforeEach(() => {
    prisma = {
      fieldVisit: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      party: { findUnique: vi.fn() },
      user: { findUnique: vi.fn() },
    }
    service = new FieldVisitsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('builds a flat where clause from direct filters', async () => {
      prisma.fieldVisit.findMany.mockResolvedValue([])
      await service.findAll({ visitedById: 'u-1', status: 'scheduled', visitType: 'follow_up' })
      expect(prisma.fieldVisit.findMany).toHaveBeenCalledWith({
        where: { visitedById: 'u-1', status: 'scheduled', visitType: 'follow_up' },
        include: {
          party: { select: { id: true, name: true, type: true } },
          visitor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      })
    })

    it('filters by organization through the party relation', async () => {
      prisma.fieldVisit.findMany.mockResolvedValue([])
      await service.findAll({ organizationId: 'org-1' })
      expect(prisma.fieldVisit.findMany).toHaveBeenCalledWith({
        where: { party: { organizationId: 'org-1' } },
        include: {
          party: { select: { id: true, name: true, type: true } },
          visitor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      })
    })

    it('uses an empty where clause when no filters are provided', async () => {
      prisma.fieldVisit.findMany.mockResolvedValue([])
      await service.findAll()
      expect(prisma.fieldVisit.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          party: { select: { id: true, name: true, type: true } },
          visitor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('returns the field visit when found', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue({ id: 'fv-1' })
      await expect(service.findOne('fv-1')).resolves.toEqual({ id: 'fv-1' })
      expect(prisma.fieldVisit.findUnique).toHaveBeenCalledWith({
        where: { id: 'fv-1' },
        include: {
          party: { select: { id: true, name: true, type: true } },
          visitor: { select: { id: true, name: true, email: true } },
        },
      })
    })

    it('throws NotFoundException when the field visit does not exist', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    const validData = {
      partyId: 'p-1',
      visitedById: 'u-1',
      visitType: 'site_visit',
      scheduledDate: '2026-08-01T10:00:00.000Z',
      latitude: '12.345',
      longitude: '67.890',
    }

    it('throws BadRequestException when the party does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue(null)
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.fieldVisit.create).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when the visitor does not exist', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.create(validData)).rejects.toThrow(BadRequestException)
      expect(prisma.fieldVisit.create).not.toHaveBeenCalled()
    })

    it('creates a field visit with parsed date and decimal coordinates', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1' })
      prisma.fieldVisit.create.mockResolvedValue({ id: 'fv-1' })
      await expect(service.create(validData)).resolves.toEqual({ id: 'fv-1' })
      const arg = prisma.fieldVisit.create.mock.calls[0][0]
      expect(arg.data.scheduledDate).toEqual(new Date(validData.scheduledDate))
      expect(arg.data.latitude).toBeInstanceOf(Prisma.Decimal)
      expect(arg.data.longitude).toBeInstanceOf(Prisma.Decimal)
      expect(arg.data.location).toBeUndefined()
      expect(arg.data.notes).toBeUndefined()
    })

    it('leaves coordinates undefined when not provided', async () => {
      prisma.party.findUnique.mockResolvedValue({ id: 'p-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1' })
      prisma.fieldVisit.create.mockResolvedValue({ id: 'fv-1' })
      await service.create({ partyId: 'p-1', visitedById: 'u-1', visitType: 'call', scheduledDate: '2026-08-01T10:00:00.000Z' })
      const arg = prisma.fieldVisit.create.mock.calls[0][0]
      expect(arg.data.latitude).toBeUndefined()
      expect(arg.data.longitude).toBeUndefined()
    })
  })

  describe('update', () => {
    it('updates only the provided fields', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue({ id: 'fv-1' })
      prisma.fieldVisit.update.mockResolvedValue({ id: 'fv-1', status: 'completed' })
      await service.update('fv-1', { status: 'completed' })
      const arg = prisma.fieldVisit.update.mock.calls[0][0]
      expect(arg.data).toEqual({ status: 'completed' })
      expect(arg.where).toEqual({ id: 'fv-1' })
    })

    it('parses completedDate into a Date', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue({ id: 'fv-1' })
      prisma.fieldVisit.update.mockResolvedValue({ id: 'fv-1' })
      await service.update('fv-1', { completedDate: '2026-08-05T00:00:00.000Z' })
      const arg = prisma.fieldVisit.update.mock.calls[0][0]
      expect(arg.data.completedDate).toEqual(new Date('2026-08-05T00:00:00.000Z'))
    })

    it('throws NotFoundException when the field visit does not exist', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', { status: 'completed' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('deletes an existing field visit', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue({ id: 'fv-1' })
      prisma.fieldVisit.delete.mockResolvedValue({ id: 'fv-1' })
      await expect(service.remove('fv-1')).resolves.toEqual({ id: 'fv-1' })
      expect(prisma.fieldVisit.delete).toHaveBeenCalledWith({ where: { id: 'fv-1' } })
    })

    it('throws NotFoundException when the field visit does not exist', async () => {
      prisma.fieldVisit.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getStats', () => {
    it('tallies visits by status and type', async () => {
      prisma.fieldVisit.findMany.mockResolvedValue([
        { status: 'completed', visitType: 'site_visit' },
        { status: 'completed', visitType: 'site_visit' },
        { status: 'scheduled', visitType: 'follow_up' },
      ])
      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 3,
        byStatus: { completed: 2, scheduled: 1 },
        byVisitType: { site_visit: 2, follow_up: 1 },
      })
      expect(prisma.fieldVisit.findMany).toHaveBeenCalledWith({
        where: { party: { organizationId: 'org-1' } },
        select: { status: true, visitType: true },
      })
    })
  })
})
