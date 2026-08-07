import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AppSettingsService } from './app-settings.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('AppSettingsService', () => {
  let service: AppSettingsService
  let prisma: {
    appSetting: {
      findMany: ReturnType<typeof vi.fn>
      findUnique: ReturnType<typeof vi.fn>
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      delete: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    prisma = {
      appSetting: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    }
    service = new AppSettingsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('returns settings for the organization ordered by key', async () => {
      prisma.appSetting.findMany.mockResolvedValue([{ id: 's-1', key: 'gstRate' }])
      await expect(service.findAll('org-1')).resolves.toEqual([{ id: 's-1', key: 'gstRate' }])
      expect(prisma.appSetting.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { key: 'asc' },
      })
    })
  })

  describe('findOne', () => {
    it('returns the setting when found', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1' })
      await expect(service.findOne('s-1')).resolves.toEqual({ id: 's-1' })
      expect(prisma.appSetting.findUnique).toHaveBeenCalledWith({ where: { id: 's-1' } })
    })

    it('throws NotFoundException when the setting does not exist', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null)
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findByKey', () => {
    it('returns the setting for the organization key pair', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1', key: 'gstRate' })
      await expect(service.findByKey('org-1', 'gstRate')).resolves.toEqual({ id: 's-1', key: 'gstRate' })
      expect(prisma.appSetting.findUnique).toHaveBeenCalledWith({
        where: { organizationId_key: { organizationId: 'org-1', key: 'gstRate' } },
      })
    })

    it('throws NotFoundException when the key does not exist', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null)
      await expect(service.findByKey('org-1', 'gstRate')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('throws BadRequestException when the key already exists', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1' })
      await expect(service.create({ organizationId: 'org-1', key: 'gstRate', value: 18 })).rejects.toThrow(BadRequestException)
      expect(prisma.appSetting.create).not.toHaveBeenCalled()
    })

    it('creates a new setting', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null)
      prisma.appSetting.create.mockResolvedValue({ id: 's-1', key: 'gstRate', value: 18 })
      await expect(service.create({ organizationId: 'org-1', key: 'gstRate', value: 18, description: 'GST rate' })).resolves.toEqual({
        id: 's-1',
        key: 'gstRate',
        value: 18,
      })
      expect(prisma.appSetting.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', key: 'gstRate', value: 18, description: 'GST rate' },
      })
    })
  })

  describe('update', () => {
    it('throws NotFoundException when the setting does not exist', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null)
      await expect(service.update('missing', { value: 18 })).rejects.toThrow(NotFoundException)
    })

    it('updates only the provided fields', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1' })
      prisma.appSetting.update.mockResolvedValue({ id: 's-1', value: 18 })
      await service.update('s-1', { value: 18 })
      expect(prisma.appSetting.update).toHaveBeenCalledWith({ where: { id: 's-1' }, data: { value: 18 } })
    })

    it('leaves unset fields out of the update payload', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1' })
      prisma.appSetting.update.mockResolvedValue({ id: 's-1' })
      await service.update('s-1', { description: 'Updated' })
      const arg = prisma.appSetting.update.mock.calls[0][0]
      expect(arg.data).toEqual({ description: 'Updated' })
    })
  })

  describe('remove', () => {
    it('deletes an existing setting', async () => {
      prisma.appSetting.findUnique.mockResolvedValue({ id: 's-1' })
      prisma.appSetting.delete.mockResolvedValue({ id: 's-1' })
      await expect(service.remove('s-1')).resolves.toEqual({ id: 's-1' })
      expect(prisma.appSetting.delete).toHaveBeenCalledWith({ where: { id: 's-1' } })
    })

    it('throws NotFoundException when the setting does not exist', async () => {
      prisma.appSetting.findUnique.mockResolvedValue(null)
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })
})
