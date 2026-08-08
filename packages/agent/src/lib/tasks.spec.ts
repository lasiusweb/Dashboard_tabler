import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskQueue, type Task } from './tasks'
import { PrismaClient } from '@firstcrop/db'

describe('TaskQueue', () => {
  let queue: TaskQueue
  let prisma: {
    agentTask: {
      create: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      count: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
    }
    $queryRaw: ReturnType<typeof vi.fn>
  }

  const task: Task = {
    id: 't-1',
    kind: 'EXPIRY_ALERT',
    title: 'Check batch expiry',
    priority: 'NORMAL',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    prisma = {
      agentTask: {
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      $queryRaw: vi.fn(),
    }
    queue = new TaskQueue(prisma as unknown as PrismaClient)
  })

  describe('createTask', () => {
    it('creates a PENDING task with default priority', async () => {
      prisma.agentTask.create.mockResolvedValue(task)
      await queue.createTask({
        organizationId: 'org-1',
        kind: 'EXPIRY_ALERT',
        title: 'Check batch expiry',
      })
      expect(prisma.agentTask.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          kind: 'EXPIRY_ALERT',
          entityType: undefined,
          entityId: undefined,
          title: 'Check batch expiry',
          description: undefined,
          priority: 'NORMAL',
          status: 'PENDING',
          scheduledFor: undefined,
          createdById: undefined,
          assignedToId: undefined,
        },
      })
    })

    it('preserves an explicit priority', async () => {
      prisma.agentTask.create.mockResolvedValue(task)
      await queue.createTask({
        organizationId: 'org-1',
        kind: 'COMPLIANCE_CHECK',
        title: 'Renew certificate',
        priority: 'URGENT',
      })
      expect(prisma.agentTask.create.mock.calls[0][0].data.priority).toBe('URGENT')
    })
  })

  describe('getNextTask', () => {
    it('returns the task claimed by the raw query', async () => {
      prisma.$queryRaw.mockResolvedValue([task])
      const result = await queue.getNextTask('org-1', 'worker-1')
      expect(result).toEqual(task)
    })

    it('returns null when no task is available', async () => {
      prisma.$queryRaw.mockResolvedValue([])
      const result = await queue.getNextTask('org-1', 'worker-1')
      expect(result).toBeNull()
    })
  })

  describe('completeTask', () => {
    it('marks the task COMPLETED with the result', async () => {
      const completed = { ...task, status: 'COMPLETED' }
      prisma.agentTask.update.mockResolvedValue(completed)
      const result = await queue.completeTask('t-1', { ok: true })
      expect(prisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          result: { ok: true },
        },
      })
      expect(result).toEqual(completed)
    })
  })

  describe('failTask', () => {
    it('marks the task FAILED with the error message', async () => {
      const failed = { ...task, status: 'FAILED' }
      prisma.agentTask.update.mockResolvedValue(failed)
      await queue.failTask('t-1', 'boom')
      expect(prisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          status: 'FAILED',
          result: { error: 'boom' },
        },
      })
    })
  })

  describe('cancelTask', () => {
    it('marks the task CANCELLED', async () => {
      const cancelled = { ...task, status: 'CANCELLED' }
      prisma.agentTask.update.mockResolvedValue(cancelled)
      await queue.cancelTask('t-1')
      expect(prisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { status: 'CANCELLED' },
      })
    })
  })

  describe('getTaskStats', () => {
    it('aggregates counts by status and kind', async () => {
      prisma.agentTask.count.mockResolvedValueOnce(3)
      prisma.agentTask.count.mockResolvedValueOnce(1)
      prisma.agentTask.count.mockResolvedValueOnce(5)
      prisma.agentTask.count.mockResolvedValueOnce(1)
      prisma.agentTask.groupBy.mockResolvedValue([{ kind: 'EXPIRY_ALERT', _count: 2 }])

      const stats = await queue.getTaskStats('org-1')

      expect(stats).toEqual({
        pending: 3,
        inProgress: 1,
        completed: 5,
        failed: 1,
        total: 10,
        byKind: [{ kind: 'EXPIRY_ALERT', _count: 2 }],
      })
    })
  })

  describe('getOverdueTasks', () => {
    it('filters pending and in-progress tasks past their scheduled time', async () => {
      prisma.agentTask.findMany.mockResolvedValue([task])
      await queue.getOverdueTasks('org-1')
      const arg = prisma.agentTask.findMany.mock.calls[0][0]
      expect(arg.where).toEqual({
        organizationId: 'org-1',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        scheduledFor: { lt: expect.any(Date) },
      })
      expect(arg.orderBy).toEqual({ scheduledFor: 'asc' })
    })
  })

  describe('rescheduleTask', () => {
    it('resets the schedule and returns the task to PENDING', async () => {
      const rescheduled = { ...task, status: 'PENDING' }
      prisma.agentTask.update.mockResolvedValue(rescheduled)
      const newDate = new Date('2026-09-01T00:00:00Z')
      await queue.rescheduleTask('t-1', newDate)
      expect(prisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          scheduledFor: newDate,
          status: 'PENDING',
        },
      })
    })
  })
})
