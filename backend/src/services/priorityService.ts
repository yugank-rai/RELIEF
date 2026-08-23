export interface PriorityInputs {
  severity: string | number; // 'critical' | 'high' | 'moderate' | 'low' or 0-10
  createdAt: Date | string | number;
  vulnerabilityScore?: number; // 0-10
  trappedCount?: number;
  elderlyChildCount?: number;
  medicalEmergency?: boolean;
  resourceUrgencyScore?: number; // 0-10
  reportCount?: number;
}

export interface PriorityBreakdown {
  totalScore: number;
  components: {
    severityScore: number;
    timeWaitingScore: number;
    vulnerabilityScore: number;
    resourceUrgencyScore: number;
    reportCountScore: number;
  };
  weights: {
    severity: number;
    timeWaiting: number;
    vulnerability: number;
    resourceUrgency: number;
    reportCount: number;
  };
  normalizedFormula: string;
}

export function normalizeSeverity(severity: string | number): number {
  if (typeof severity === 'number') {
    return Math.min(10, Math.max(0, severity));
  }
  const s = severity.toLowerCase().trim();
  if (s === 'critical') return 10.0;
  if (s === 'high') return 7.5;
  if (s === 'moderate') return 5.0;
  if (s === 'low') return 2.5;
  return 5.0;
}

export function calculateTimeWaitingScore(createdAt: Date | string | number): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const minutesElapsed = Math.max(0, (now - created) / (1000 * 60));
  // 0 to 180 minutes mapped to 0 to 10 points
  const score = Math.min(10, (minutesElapsed / 180) * 10);
  return Math.round(score * 100) / 100;
}

export function calculateVulnerabilityScore(inputs: {
  vulnerabilityScore?: number;
  trappedCount?: number;
  elderlyChildCount?: number;
  medicalEmergency?: boolean;
}): number {
  if (inputs.vulnerabilityScore !== undefined && inputs.vulnerabilityScore !== null) {
    return Math.min(10, Math.max(0, inputs.vulnerabilityScore));
  }
  let base = 3.0;
  if (inputs.trappedCount && inputs.trappedCount > 0) {
    base += Math.min(4.0, inputs.trappedCount * 2.0);
  }
  if (inputs.elderlyChildCount && inputs.elderlyChildCount > 0) {
    base += Math.min(2.0, inputs.elderlyChildCount * 1.0);
  }
  if (inputs.medicalEmergency) {
    base += 2.5;
  }
  return Math.min(10.0, Math.max(0.0, Math.round(base * 10) / 10));
}

export function calculatePriorityScore(inputs: PriorityInputs): PriorityBreakdown {
  const severityScore = normalizeSeverity(inputs.severity);
  const timeWaitingScore = calculateTimeWaitingScore(inputs.createdAt);
  const vulnerabilityScore = calculateVulnerabilityScore({
    vulnerabilityScore: inputs.vulnerabilityScore,
    trappedCount: inputs.trappedCount,
    elderlyChildCount: inputs.elderlyChildCount,
    medicalEmergency: inputs.medicalEmergency,
  });
  const resourceUrgencyScore = Math.min(10, Math.max(0, inputs.resourceUrgencyScore ?? 5.0));
  const count = Math.max(1, inputs.reportCount ?? 1);
  const reportCountScore = Math.min(10, count * 1.0); // 1->1, 5->5, 10+->10

  // Locked formula:
  // Priority = (0.35 × Severity) + (0.20 × TimeWaiting) + (0.20 × Vulnerability) + (0.15 × ResourceUrgency) + (0.10 × ReportCount)
  const weighted =
    0.35 * severityScore +
    0.20 * timeWaitingScore +
    0.20 * vulnerabilityScore +
    0.15 * resourceUrgencyScore +
    0.10 * reportCountScore;

  const totalScore = Math.min(10.0, Math.max(0.0, Math.round(weighted * 100) / 100));

  return {
    totalScore,
    components: {
      severityScore,
      timeWaitingScore,
      vulnerabilityScore,
      resourceUrgencyScore,
      reportCountScore,
    },
    weights: {
      severity: 0.35,
      timeWaiting: 0.20,
      vulnerability: 0.20,
      resourceUrgency: 0.15,
      reportCount: 0.10,
    },
    normalizedFormula: `(0.35 × ${severityScore}) + (0.20 × ${timeWaitingScore}) + (0.20 × ${vulnerabilityScore}) + (0.15 × ${resourceUrgencyScore}) + (0.10 × ${reportCountScore}) = ${totalScore}`,
  };
}
