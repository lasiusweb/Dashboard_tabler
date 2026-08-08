import { describe, it, expect, beforeEach } from 'vitest'
import { EvidenceScorer, EVIDENCE_WEIGHTS, type EvidenceFact } from './evidence'

describe('EvidenceScorer', () => {
  let scorer: EvidenceScorer

  beforeEach(() => {
    scorer = new EvidenceScorer()
  })

  function makeFact(overrides: Partial<EvidenceFact> = {}): Omit<EvidenceFact, 'id'> {
    return {
      entityType: 'party',
      entityId: 'p-1',
      factType: 'vendor_verified',
      factValue: true,
      confidence: 1,
      source: 'fssai.license-match',
      sourcedAt: new Date(),
      ...overrides,
    }
  }

  describe('addFact', () => {
    it('assigns a unique id to each fact', () => {
      const a = scorer.addFact(makeFact())
      const b = scorer.addFact(makeFact())
      expect(a.id).toBeTruthy()
      expect(a.id).not.toBe(b.id)
    })

    it('groups facts by entity and fact type', () => {
      scorer.addFact(makeFact({ entityId: 'p-1' }))
      scorer.addFact(makeFact({ entityId: 'p-1' }))
      scorer.addFact(makeFact({ entityId: 'p-2' }))
      expect(scorer.getFacts('party', 'p-1')).toHaveLength(2)
      expect(scorer.getFacts('party', 'p-2')).toHaveLength(1)
    })
  })

  describe('getFacts', () => {
    it('returns an empty array for an unknown entity', () => {
      expect(scorer.getFacts('party', 'missing')).toEqual([])
    })
  })

  describe('calculateScore', () => {
    it('returns a zeroed score when no facts exist', () => {
      expect(scorer.calculateScore('party', 'p-1', 'vendor_verified')).toEqual({
        factType: 'vendor_verified',
        totalScore: 0,
        sourceCount: 0,
        bestSource: '',
        bestWeight: 0,
        facts: [],
      })
    })

    it('computes a weighted score from confidence and source weight', () => {
      scorer.addFact(makeFact({ confidence: 0.8, source: 'fssai.license-match' }))
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      const expected = 0.8 * (EVIDENCE_WEIGHTS['fssai.license-match'] ?? 0.5)
      expect(score.sourceCount).toBe(1)
      expect(score.totalScore).toBeCloseTo(expected, 5)
      expect(score.bestSource).toBe('fssai.license-match')
    })

    it('uses the fallback weight for unknown sources', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'custom.source' }))
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      expect(score.totalScore).toBe(0.5)
    })

    it('caps the total score at 1', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'lab.test-certificate' }))
      scorer.addFact(makeFact({ confidence: 1, source: 'fssai.license-verified' }))
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      expect(score.totalScore).toBe(1)
    })

    it('picks the highest-weight source as best', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'trade.directory-listing' }))
      scorer.addFact(makeFact({ confidence: 1, source: 'lab.test-certificate' }))
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      expect(score.bestSource).toBe('lab.test-certificate')
    })

    it('ignores expired facts', () => {
      scorer.addFact(
        makeFact({
          confidence: 1,
          source: 'lab.test-certificate',
          expiresAt: new Date(Date.now() - 1000),
        }),
      )
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      expect(score.sourceCount).toBe(0)
      expect(score.totalScore).toBe(0)
    })

    it('ignores superseded facts', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'lab.test-certificate' }))
      scorer.addFact(
        makeFact({ confidence: 0.5, source: 'trade.directory-listing', supersededById: 'x' }),
      )
      const score = scorer.calculateScore('party', 'p-1', 'vendor_verified')
      expect(score.sourceCount).toBe(1)
    })
  })

  describe('calculateOverallConfidence', () => {
    it('returns 0 when there are no facts', () => {
      expect(scorer.calculateOverallConfidence('party', 'p-1')).toBe(0)
    })

    it('averages scores across fact types', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'fssai.license-match' })) // 0.9
      scorer.addFact(makeFact({ factType: 'other', confidence: 1, source: 'vendor.purchase-order' })) // 0.8
      const confidence = scorer.calculateOverallConfidence('party', 'p-1')
      expect(confidence).toBeCloseTo((0.9 + 0.8) / 2, 5)
    })
  })

  describe('detectContradictions', () => {
    it('returns empty when no facts contradict', () => {
      scorer.addFact(makeFact({ factValue: true }))
      scorer.addFact(makeFact({ factValue: true }))
      expect(scorer.detectContradictions('party', 'p-1', 'vendor_verified')).toEqual([])
    })

    it('detects boolean contradictions', () => {
      scorer.addFact(makeFact({ factValue: true }))
      scorer.addFact(makeFact({ factValue: false }))
      const contradictions = scorer.detectContradictions('party', 'p-1', 'vendor_verified')
      expect(contradictions).toHaveLength(2)
    })

    it('detects opposing string values', () => {
      scorer.addFact(makeFact({ factValue: 'pass' }))
      scorer.addFact(makeFact({ factValue: 'fail' }))
      const contradictions = scorer.detectContradictions('party', 'p-1', 'vendor_verified')
      expect(contradictions).toHaveLength(2)
    })

    it('ignores non-opposing string values', () => {
      scorer.addFact(makeFact({ factValue: 'pass' }))
      scorer.addFact(makeFact({ factValue: 'pass' }))
      expect(scorer.detectContradictions('party', 'p-1', 'vendor_verified')).toEqual([])
    })
  })

  describe('getEvidenceSummary', () => {
    it('summarizes facts and confidence per entity', () => {
      scorer.addFact(makeFact({ confidence: 1, source: 'fssai.license-match' }))
      const summary = scorer.getEvidenceSummary('party', 'p-1')
      expect(summary.entityId).toBe('p-1')
      expect(summary.totalFacts).toBe(1)
      expect(summary.overallConfidence).toBeGreaterThan(0)
      expect(summary.factScores.vendor_verified).toBeDefined()
    })
  })
})

describe('EVIDENCE_WEIGHTS', () => {
  it('ranks lab test certificates highest', () => {
    expect(EVIDENCE_WEIGHTS['lab.test-certificate']).toBe(0.95)
    expect(EVIDENCE_WEIGHTS['trade.directory-listing']).toBe(0.4)
  })

  it('weights contradiction at zero', () => {
    expect(EVIDENCE_WEIGHTS['contradiction']).toBe(0)
  })
})
