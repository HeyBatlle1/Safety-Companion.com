interface RiskFactor {
  severity: number;  // 1-10
  probability: number;  // 1-10
  description: string;
}

export function calculateRiskScore(severity: number, probability: number): number {
  return severity * probability;
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 50) return 'critical';
  if (score >= 30) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

export function assessTaskRisks(task: any): RiskFactor[] {
  const risks: RiskFactor[] = [];

  // Height risks
  if (task.type.includes('height') || task.type.includes('scaffold')) {
    risks.push({
      severity: 9,
      probability: task.height > 3 ? 7 : 4,
      description: 'Fall from height'
    });
  }

  // Heavy machinery risks
  if (task.equipment?.some((e: string) => e.includes('crane') || e.includes('excavator'))) {
    risks.push({
      severity: 8,
      probability: 5,
      description: 'Heavy machinery operation'
    });
  }

  // Chemical exposure risks
  if (task.type.includes('chemical') || task.materials?.some((m: string) => m.includes('chemical'))) {
    risks.push({
      severity: 7,
      probability: 6,
      description: 'Chemical exposure'
    });
  }

  return risks;
}

export function combineRiskFactors(factors: RiskFactor[]): RiskFactor {
  const maxSeverity = Math.max(...factors.map(f => f.severity));
  const avgProbability = Math.round(
    factors.reduce((sum, f) => sum + f.probability, 0) / factors.length
  );
  
  return {
    severity: maxSeverity,
    probability: avgProbability,
    description: 'Combined risk assessment'
  };
}