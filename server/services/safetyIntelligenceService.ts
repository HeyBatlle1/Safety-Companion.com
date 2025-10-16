/**
 * Professional Safety Intelligence Service
 * Cloud-based OSHA data integration for Safety Companion
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, like, and, desc } from "drizzle-orm";
import { oshaInjuryRates, industryBenchmarks, safetyIntelligence, jhsaTemplates } from "../../shared/schema";

// Use NeonDB for OSHA reference data (knowledge pool)
const sql = neon(process.env.DATABASE_URL!);
const oshaDb = drizzle(sql);

export interface RiskProfile {
  naicsCode: string;
  industryName: string;
  injuryRate: number | null;
  fatalities2023: number | null;
  riskScore: number;
  riskCategory: string;
  recommendations: string[];
}

export interface IndustryBenchmark {
  naicsCode: string;
  industryName: string;
  injuryRate: number | null;
}

export interface JHSAJobStep {
  stepNumber: number;
  taskDescription: string;
  potentialHazards: string[];
  preventiveMeasures: string[];
  requiredPPE: string[];
  trainingRequirements: string[];
}

export interface JHSATemplate {
  jobInfo: {
    jobTitle: string;
    naicsCode: string;
    industryName: string;
    dateCreated?: string;
    analystName?: string;
    jobLocation?: string;
  };
  riskContext: {
    industryInjuryRate: number | null;
    industryRiskScore: number;
    industryRiskCategory: string;
    fatalities2023: number | null;
  };
  jobSteps: JHSAJobStep[];
}

export class SafetyIntelligenceService {
  
  /**
   * Get comprehensive risk profile for NAICS industry code using real OSHA data
   */
  async getRiskProfile(naicsCode: string): Promise<RiskProfile> {
    // Get injury rate data from NeonDB OSHA reference pool
    const [injuryData] = await oshaDb
      .select()
      .from(oshaInjuryRates)
      .where(and(
        eq(oshaInjuryRates.naicsCode, naicsCode),
        eq(oshaInjuryRates.dataSource, "BLS_Table_1_2023")
      ))
      .limit(1);

    // Get fatality data from NeonDB OSHA reference pool
    const [fatalityData] = await oshaDb
      .select()
      .from(oshaInjuryRates)
      .where(and(
        eq(oshaInjuryRates.naicsCode, naicsCode),
        eq(oshaInjuryRates.dataSource, "BLS_FATALITIES_A1_2023")
      ))
      .limit(1);

    // Calculate professional risk score
    const riskScore = this.calculateRiskScore(injuryData, fatalityData);

    return {
      naicsCode,
      industryName: injuryData?.industryName || 'Unknown Industry',
      injuryRate: injuryData?.injuryRate || null,
      fatalities2023: fatalityData?.totalCases || null,
      riskScore,
      riskCategory: this.getRiskCategory(riskScore),
      recommendations: this.getSafetyRecommendations(riskScore)
    };
  }

  /**
   * Get industry benchmark data for comparative analysis
   */
  async getIndustryBenchmark(naicsPrefix: string): Promise<IndustryBenchmark[]> {
    const results = await oshaDb
      .select()
      .from(oshaInjuryRates)
      .where(and(
        like(oshaInjuryRates.naicsCode, `${naicsPrefix}%`),
        eq(oshaInjuryRates.dataSource, "BLS_Table_1_2023")
      ));

    return results.map(row => ({
      naicsCode: row.naicsCode,
      industryName: row.industryName,
      injuryRate: row.injuryRate
    }));
  }

  /**
   * Find industries with similar injury rates for comparative analysis
   */
  async searchSimilarIndustries(injuryRateTarget: number, tolerance: number = 0.5): Promise<any[]> {
    const allData = await oshaDb
      .select()
      .from(oshaInjuryRates)
      .where(eq(oshaInjuryRates.dataSource, "BLS_Table_1_2023"));

    const similar = allData
      .filter(row => row.injuryRate && Math.abs(row.injuryRate - injuryRateTarget) <= tolerance)
      .map(row => ({
        naicsCode: row.naicsCode,
        industryName: row.industryName,
        injuryRate: row.injuryRate,
        rateDifference: Math.abs((row.injuryRate || 0) - injuryRateTarget)
      }))
      .sort((a, b) => a.rateDifference - b.rateDifference);

    return similar;
  }

  /**
   * Generate JHSA template based on NAICS code and job requirements
   */
  async generateJHSATemplate(
    naicsCode: string, 
    jobTitle: string, 
    customTasks?: string[],
    userId?: string
  ): Promise<JHSATemplate> {
    const riskProfile = await this.getRiskProfile(naicsCode);
    
    // Get trade-specific tasks or use defaults
    const tasks = customTasks || this.getDefaultTasksForNAICS(naicsCode);
    
    const jobSteps: JHSAJobStep[] = tasks.map((task, index) => ({
      stepNumber: index + 1,
      taskDescription: task,
      potentialHazards: this.identifyHazardsForTask(task, naicsCode),
      preventiveMeasures: this.getPreventiveMeasuresForTask(task, naicsCode),
      requiredPPE: this.getRequiredPPEForTask(task, naicsCode),
      trainingRequirements: this.getTrainingRequirements(task, naicsCode)
    }));

    const jhsaTemplate: JHSATemplate = {
      jobInfo: {
        jobTitle,
        naicsCode,
        industryName: riskProfile.industryName
      },
      riskContext: {
        industryInjuryRate: riskProfile.injuryRate,
        industryRiskScore: riskProfile.riskScore,
        industryRiskCategory: riskProfile.riskCategory,
        fatalities2023: riskProfile.fatalities2023
      },
      jobSteps
    };

    // Save to database if userId provided
    if (userId) {
      await oshaDb.insert(jhsaTemplates).values({
        userId,
        naicsCode,
        jobTitle,
        industryName: riskProfile.industryName,
        riskScore: riskProfile.riskScore,
        riskCategory: riskProfile.riskCategory,
        jobSteps: jobSteps,
        hazardAnalysis: {
          totalSteps: jobSteps.length,
          highRiskSteps: jobSteps.filter(step => step.potentialHazards.length > 3).length,
          primaryHazards: this.extractPrimaryHazards(jobSteps)
        }
      });
    }

    return jhsaTemplate;
  }

  /**
   * Professional risk scoring algorithm based on real OSHA data
   */
  private calculateRiskScore(injuryData: any, fatalityData: any): number {
    let score = 0;

    // Injury rate component (0-50 points)
    if (injuryData?.injuryRate) {
      score += Math.min(injuryData.injuryRate * 10, 50);
    }

    // Fatality component (0-50 points)  
    if (fatalityData?.totalCases) {
      score += Math.min(fatalityData.totalCases * 0.5, 50);
    }

    return Math.round(Math.min(score, 100) * 10) / 10;
  }

  /**
   * Categorize risk level based on professional standards
   */
  private getRiskCategory(riskScore: number): string {
    if (riskScore >= 75) return "CRITICAL";
    if (riskScore >= 50) return "HIGH";
    if (riskScore >= 25) return "MODERATE";
    return "LOW";
  }

  /**
   * Generate industry-specific safety recommendations
   */
  private getSafetyRecommendations(riskScore: number): string[] {
    if (riskScore >= 75) {
      return [
        "Implement immediate safety intervention program",
        "Mandatory daily safety briefings with documentation",
        "Enhanced PPE requirements with compliance monitoring",
        "Third-party safety audit recommended within 30 days",
        "Consider work stoppage for critical hazard assessment"
      ];
    } else if (riskScore >= 50) {
      return [
        "Increase safety training frequency to weekly sessions",
        "Review and update safety protocols quarterly",
        "Implement weekly safety inspections with reporting",
        "Enhance incident reporting and near-miss tracking"
      ];
    } else if (riskScore >= 25) {
      return [
        "Maintain current safety standards with regular review",
        "Conduct monthly safety training updates",
        "Monitor injury trends with quarterly analysis",
        "Ensure OSHA compliance documentation is current"
      ];
    } else {
      return [
        "Continue current best practices",
        "Share safety insights with industry peers",
        "Maintain proactive safety culture",
        "Regular safety performance reviews"
      ];
    }
  }

  // Trade-specific hazard identification and controls
  private getDefaultTasksForNAICS(naicsCode: string): string[] {
    const tradeTemplates: Record<string, string[]> = {
      '23815': [ // Glass and Glazing
        'Material delivery and staging',
        'Glass cutting and preparation',
        'Installation of anchors and frames',
        'Glass panel lifting and positioning',
        'Glazing compound application',
        'Final inspection and cleanup'
      ],
      '23813': [ // Framing
        'Material layout and preparation',
        'Frame assembly on ground',
        'Frame lifting and positioning',
        'Fastening and securing',
        'Plumb and square checking',
        'Temporary bracing installation'
      ],
      '23816': [ // Roofing
        'Material hoisting to roof level',
        'Roof surface preparation',
        'Installation of underlayment',
        'Shingle/tile installation',
        'Flashing installation',
        'Cleanup and debris removal'
      ]
    };

    return tradeTemplates[naicsCode] || [
      'Job setup and preparation',
      'Material handling and staging',
      'Main work activity execution',
      'Quality control inspection',
      'Cleanup and site securing'
    ];
  }

  private identifyHazardsForTask(task: string, naicsCode: string): string[] {
    const hazards: string[] = [];
    const taskLower = task.toLowerCase();

    // Common construction hazards based on task keywords
    if (taskLower.includes('lifting') || taskLower.includes('material') || taskLower.includes('positioning')) {
      hazards.push('Back injury from heavy lifting', 'Crush injury from falling materials');
    }
    if (taskLower.includes('height') || taskLower.includes('roof') || taskLower.includes('elevation')) {
      hazards.push('Falls from elevation', 'Falling objects striking workers below');
    }
    if (taskLower.includes('glass') || taskLower.includes('cutting')) {
      hazards.push('Cuts from broken glass', 'Eye injury from glass shards');
    }
    if (taskLower.includes('power') || taskLower.includes('tool') || taskLower.includes('drilling')) {
      hazards.push('Electrical shock', 'Cuts from power tools', 'Noise exposure');
    }

    return hazards.length > 0 ? hazards : ['General workplace hazards'];
  }

  private getPreventiveMeasuresForTask(task: string, naicsCode: string): string[] {
    const measures: string[] = [];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('lifting') || taskLower.includes('material')) {
      measures.push('Use mechanical lifting aids', 'Team lifting for heavy items', 'Proper lifting technique training');
    }
    if (taskLower.includes('height') || taskLower.includes('roof')) {
      measures.push('Fall protection harness required', 'Guardrails installation', 'Safety nets where applicable');
    }
    if (taskLower.includes('glass')) {
      measures.push('Cut-resistant gloves', 'Glass handling training', 'Proper storage and transport');
    }

    return measures.length > 0 ? measures : ['Follow standard safety procedures'];
  }

  private getRequiredPPEForTask(task: string, naicsCode: string): string[] {
    const ppe = ['Hard hat', 'Safety glasses', 'Steel-toed boots']; // Base PPE
    const taskLower = task.toLowerCase();

    if (taskLower.includes('height') || taskLower.includes('roof')) {
      ppe.push('Fall protection harness');
    }
    if (taskLower.includes('glass') || taskLower.includes('cutting')) {
      ppe.push('Cut-resistant gloves');
    }
    if (taskLower.includes('noise') || taskLower.includes('drilling')) {
      ppe.push('Hearing protection');
    }

    return ppe;
  }

  private getTrainingRequirements(task: string, naicsCode: string): string[] {
    const training = ['General safety orientation'];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('height')) {
      training.push('Fall protection training');
    }
    if (taskLower.includes('lifting')) {
      training.push('Proper lifting techniques');
    }
    if (taskLower.includes('glass')) {
      training.push('Glass handling procedures');
    }

    return training;
  }

  private extractPrimaryHazards(jobSteps: JHSAJobStep[]): string[] {
    const allHazards = jobSteps.flatMap(step => step.potentialHazards);
    const hazardCounts = allHazards.reduce((acc, hazard) => {
      acc[hazard] = (acc[hazard] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(hazardCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hazard]) => hazard);
  }
}

export const safetyIntelligenceService = new SafetyIntelligenceService();