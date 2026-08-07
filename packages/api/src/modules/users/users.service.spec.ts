import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('UsersService', () => {
  let service: UsersService
  let prisma: {
    user: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    }
    service = new UsersService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('filters users by organization membership when provided', async () => {
      prisma.user.findMany.mockResolvedValue([])
      await service.findAll('org-1')
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { members: { some: { organizationId: 'org-1' } } },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('returns all users ordered by creation date without an organization', async () => {
      prisma.user.findMany.mockResolvedValue([])
      await service.findAll()
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findOne', () => {
    it('returns the user with memberships when found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', members: [] })
      await expect(service.findOne('u-1')).resolves.toEqual({ id: 'u-1', members: [] })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u-1' }, include: { members: true } })
    })

    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findByEmail', () => {
    it('returns the matching user or null', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.c' })
      await expect(service.findByEmail('a@b.c')).resolves.toEqual({ id: 'u-1', email: 'a@b.c' })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.c' } })
    })
  })

  describe('findByPhone', () => {
    it('returns the matching user or null', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.findByPhone('+91 99999')).resolves.toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { phone: '+91 99999' } })
    })
  })

  describe('update', () => {
    it('updates the user', async () => {
      prisma.user.update.mockResolvedValue({ id: 'u-1', name: 'Anna' })
      await expect(service.update('u-1', { name: 'Anna' })).resolves.toEqual({ id: 'u-1', name: 'Anna' })
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u-1' }, data: { name: 'Anna' } })
    })
  })

  describe('getStats', () => {
    it('returns total users and department breakdown', async () => {
      prisma.user.count.mockResolvedValue(4)
      prisma.user.groupBy.mockResolvedValue([
        { department: 'field_sales', _count: 3 },
        { department: 'production', _count: 1 },
      ])
      await expect(service.getStats('org-1')).resolves.toEqual({
        total: 4,
        byDepartment: [
          { department: 'field_sales', _count: 3 },
          { department: 'production', _count: 1 },
        ],
      })
      expect(prisma.user.count).toHaveBeenCalledWith({ where: { members: { some: { organizationId: 'org-1' } } } })
    })
  })
})
