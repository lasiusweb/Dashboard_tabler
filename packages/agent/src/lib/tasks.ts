/**
 * Task queue for FirstCrop ERP agent
 * Uses FOR UPDATE SKIP LOCKED pattern for concurrent processing
 */

import { PrismaClient, Prisma } from '@firstcrop/db';

export interface Task {
  id: string;
  kind: string;
  entityType?: string;
  entityId?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scheduledFor?: Date;
  completedAt?: Date;
  createdById?: string;
  assignedToId?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilter {
  kind?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  scheduledBefore?: Date;
}

export class TaskQueue {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new task
   */
  async createTask(data: {
    organizationId: string;
    kind: string;
    entityType?: string;
    entityId?: string;
    title: string;
    description?: string;
    priority?: string;
    scheduledFor?: Date;
    createdById?: string;
    assignedToId?: string;
  }): Promise<Task> {
    return this.prisma.agentTask.create({
      data: {
        organizationId: data.organizationId,
        kind: data.kind,
        entityType: data.entityType,
        entityId: data.entityId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'NORMAL',
        status: 'PENDING',
        scheduledFor: data.scheduledFor,
        createdById: data.createdById,
        assignedToId: data.assignedToId,
      },
    }) as Promise<Task>;
  }

  /**
   * Get next available task using FOR UPDATE SKIP LOCKED
   * This ensures concurrent workers don't pick the same task
   */
  async getNextTask(
    organizationId: string,
    workerId: string,
    kinds?: string[],
  ): Promise<Task | null> {
    // Use raw query with FOR UPDATE SKIP LOCKED
    const result = await this.prisma.$queryRaw`
      UPDATE agent_tasks
      SET 
        status = 'IN_PROGRESS',
        assigned_to_id = ${workerId},
        updated_at = NOW()
      WHERE id = (
        SELECT id
        FROM agent_tasks
        WHERE 
          organization_id = ${organizationId}
          AND status = 'PENDING'
          AND (scheduled_for IS NULL OR scheduled_for <= NOW())
          ${kinds && kinds.length > 0 ? Prisma.sql`AND kind IN (${Prisma.join(kinds)})` : Prisma.empty}
        ORDER BY 
          CASE priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            WHEN 'LOW' THEN 4
          END,
          created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `;

    return (result as Task[])[0] || null;
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    result?: any,
  ): Promise<Task> {
    return this.prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: result || undefined,
      },
    }) as Promise<Task>;
  }

  /**
   * Fail a task
   */
  async failTask(
    taskId: string,
    error: string,
  ): Promise<Task> {
    return this.prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        result: { error },
      },
    }) as Promise<Task>;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<Task> {
    return this.prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
      },
    }) as Promise<Task>;
  }

  /**
   * Get task counts by status
   */
  async getTaskStats(organizationId: string) {
    const pending = await this.prisma.agentTask.count({
      where: {
        organizationId,
        status: 'PENDING',
      },
    });

    const inProgress = await this.prisma.agentTask.count({
      where: {
        organizationId,
        status: 'IN_PROGRESS',
      },
    });

    const completed = await this.prisma.agentTask.count({
      where: {
        organizationId,
        status: 'COMPLETED',
      },
    });

    const failed = await this.prisma.agentTask.count({
      where: {
        organizationId,
        status: 'FAILED',
      },
    });

    const byKind = await this.prisma.agentTask.groupBy({
      by: ['kind'],
      where: {
        organizationId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      _count: true,
    });

    return {
      pending,
      inProgress,
      completed,
      failed,
      total: pending + inProgress + completed + failed,
      byKind,
    };
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(organizationId: string): Promise<Task[]> {
    return this.prisma.agentTask.findMany({
      where: {
        organizationId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        scheduledFor: {
          lt: new Date(),
        },
      },
      orderBy: { scheduledFor: 'asc' },
    }) as Promise<Task[]>;
  }

  /**
   * Reschedule a task
   */
  async rescheduleTask(
    taskId: string,
    newScheduledFor: Date,
  ): Promise<Task> {
    return this.prisma.agentTask.update({
      where: { id: taskId },
      data: {
        scheduledFor: newScheduledFor,
        status: 'PENDING',
      },
    }) as Promise<Task>;
  }
}
