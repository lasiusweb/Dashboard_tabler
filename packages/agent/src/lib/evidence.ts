/**
 * Evidence scoring system for FirstCrop ERP
 * Adapted from trycompai/crm agent architecture
 */

export interface EvidenceSource {
  type: string;
  weight: number;
  description: string;
}

export interface EvidenceFact {
  id: string;
  entityType: string;
  entityId: string;
  factType: string;
  factValue: any;
  confidence: number;
  source: string;
  sourcedAt: Date;
  expiresAt?: Date;
  supersededById?: string;
}

export interface EvidenceScore {
  factType: string;
  totalScore: number;
  sourceCount: number;
  bestSource: string;
  bestWeight: number;
  facts: EvidenceFact[];
}

// Evidence weights for manufacturing context
export const EVIDENCE_WEIGHTS: Record<string, number> = {
  // Lab & Testing
  'lab.test-certificate': 0.95,
  'lab.calibrated-equipment': 0.90,
  'lab.officer-signoff': 0.85,

  // Compliance & Certification
  'fssai.license-match': 0.90,
  'fssai.license-verified': 0.95,
  'organic.certification-body': 0.90,
  'bis.standard-compliance': 0.85,
  'iso.certification-verified': 0.90,
  'gst.registration-verified': 0.85,

  // Vendor & Supply Chain
  'vendor.invoice-match': 0.85,
  'vendor.purchase-order': 0.80,
  'vendor.delivery-receipt': 0.75,
  'vendor.quality-agreement': 0.70,

  // Production & Batch
  'batch.production-record': 0.85,
  'batch.qc-result': 0.90,
  'batch.yield-calculation': 0.80,
  'batch.expiry-tracking': 0.75,

  // Inventory & Stock
  'inventory.stock-count': 0.85,
  'inventory.movement-record': 0.80,
  'inventory.physical-verification': 0.90,

  // Sales & Orders
  'order.customer-confirmation': 0.80,
  'order.delivery-proof': 0.85,
  'order.payment-received': 0.90,

  // Field & Advisory
  'field.visit-confirmed': 0.75,
  'field.crop-assessment': 0.70,
  'field.soil-test': 0.80,

  // Third Party
  'third-party.audit-report': 0.85,
  'third-party.certification': 0.60,
  'third-party.market-data': 0.50,

  // Directory & Public
  'trade.directory-listing': 0.40,
  'govt.portal-registration': 0.55,
  'company.website-claim': 0.30,

  // Claims
  'vendor.claimed-supply': 0.30,
  'vendor.self-declaration': 0.25,

  // Negative
  'contradiction': 0,
  'discrepancy': -0.2,
};

export class EvidenceScorer {
  private facts: Map<string, EvidenceFact[]> = new Map();

  /**
   * Add a fact to the evidence store
   */
  addFact(fact: Omit<EvidenceFact, 'id'>): EvidenceFact {
    const id = `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFact: EvidenceFact = { ...fact, id };

    const key = `${fact.entityType}:${fact.entityId}:${fact.factType}`;
    const existing = this.facts.get(key) || [];
    existing.push(newFact);
    this.facts.set(key, existing);

    return newFact;
  }

  /**
   * Get all facts for an entity
   */
  getFacts(entityType: string, entityId: string): EvidenceFact[] {
    const facts: EvidenceFact[] = [];
    for (const [key, value] of this.facts.entries()) {
      if (key.startsWith(`${entityType}:${entityId}:`)) {
        facts.push(...value);
      }
    }
    return facts;
  }

  /**
   * Calculate evidence score for a fact type
   */
  calculateScore(
    entityType: string,
    entityId: string,
    factType: string,
  ): EvidenceScore {
    const key = `${entityType}:${entityId}:${factType}`;
    const facts = this.facts.get(key) || [];

    if (facts.length === 0) {
      return {
        factType,
        totalScore: 0,
        sourceCount: 0,
        bestSource: '',
        bestWeight: 0,
        facts: [],
      };
    }

    // Filter out expired and superseded facts
    const now = new Date();
    const activeFacts = facts.filter(
      (f) =>
        (!f.expiresAt || f.expiresAt > now) && !f.supersededById,
    );

    if (activeFacts.length === 0) {
      return {
        factType,
        totalScore: 0,
        sourceCount: 0,
        bestSource: '',
        bestWeight: 0,
        facts: [],
      };
    }

    // Calculate weighted score
    let totalScore = 0;
    let bestWeight = 0;
    let bestSource = '';

    for (const fact of activeFacts) {
      const weight = EVIDENCE_WEIGHTS[fact.source] || 0.5;
      const weightedScore = fact.confidence * weight;
      totalScore += weightedScore;

      if (weight > bestWeight) {
        bestWeight = weight;
        bestSource = fact.source;
      }
    }

    return {
      factType,
      totalScore: Math.min(totalScore, 1), // Cap at 1.0
      sourceCount: activeFacts.length,
      bestSource,
      bestWeight,
      facts: activeFacts,
    };
  }

  /**
   * Calculate overall confidence for an entity
   */
  calculateOverallConfidence(
    entityType: string,
    entityId: string,
  ): number {
    const allFacts = this.getFacts(entityType, entityId);

    if (allFacts.length === 0) {
      return 0;
    }

    // Group by fact type
    const factTypes = new Set(allFacts.map((f) => f.factType));
    let totalScore = 0;
    let count = 0;

    for (const factType of factTypes) {
      const score = this.calculateScore(entityType, entityId, factType);
      if (score.sourceCount > 0) {
        totalScore += score.totalScore;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * Check for contradictions between facts
   */
  detectContradictions(
    entityType: string,
    entityId: string,
    factType: string,
  ): EvidenceFact[] {
    const key = `${entityType}:${entityId}:${factType}`;
    const facts = this.facts.get(key) || [];

    const contradictions: EvidenceFact[] = [];

    // Simple contradiction detection: facts with opposing values
    for (let i = 0; i < facts.length; i++) {
      for (let j = i + 1; j < facts.length; j++) {
        const fact1 = facts[i];
        const fact2 = facts[j];

        // Check if values contradict (simplified logic)
        if (this.valuesContradict(fact1.factValue, fact2.factValue)) {
          contradictions.push(fact1, fact2);
        }
      }
    }

    return contradictions;
  }

  private valuesContradict(value1: any, value2: any): boolean {
    // Simplified contradiction detection
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      return value1 !== value2;
    }

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      const opposites = [
        ['pass', 'fail'],
        ['active', 'inactive'],
        ['valid', 'invalid'],
        ['approved', 'rejected'],
      ];

      for (const [a, b] of opposites) {
        if (
          (value1.toLowerCase() === a && value2.toLowerCase() === b) ||
          (value1.toLowerCase() === b && value2.toLowerCase() === a)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get evidence summary for an entity
   */
  getEvidenceSummary(entityType: string, entityId: string) {
    const allFacts = this.getFacts(entityType, entityId);
    const factTypes = new Set(allFacts.map((f) => f.factType));

    const summary: Record<string, EvidenceScore> = {};

    for (const factType of factTypes) {
      summary[factType] = this.calculateScore(entityType, entityId, factType);
    }

    return {
      entityType,
      entityId,
      totalFacts: allFacts.length,
      overallConfidence: this.calculateOverallConfidence(entityType, entityId),
      factScores: summary,
    };
  }
}

// Singleton instance
export const evidenceScorer = new EvidenceScorer();
