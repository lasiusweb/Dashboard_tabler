import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(() => {
    controller = new HealthController()
  })

  describe('check', () => {
    it('reports the service as ok with a fresh timestamp', () => {
      const before = Date.now()
      const result = controller.check()
      const after = Date.now()

      expect(result.status).toBe('ok')
      expect(result.service).toBe('firstcrop-api')
      expect(result.version).toBe('0.0.1')
      expect(new Date(result.timestamp as string).getTime()).toBeGreaterThanOrEqual(before)
      expect(new Date(result.timestamp as string).getTime()).toBeLessThanOrEqual(after)
    })
  })
})
