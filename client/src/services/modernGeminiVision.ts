/**
 * Modern Gemini Vision Service using @google/genai SDK
 * Supports object detection, segmentation, and advanced image analysis
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

interface ObjectDetection {
  label: string;
  confidence: number;
  boundingBox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface SafetyAnalysisResult {
  overallRiskScore: number;
  detectedObjects: ObjectDetection[];
  safetyViolations: string[];
  ppeCompliance: {
    hardHats: boolean;
    safetyVests: boolean;
    steelToes: boolean;
    eyeProtection: boolean;
  };
  hazards: string[];
  recommendations: string[];
  visualAnalysis: string;
}

export class ModernGeminiVisionService {
  
  async analyzeConstructionSafety(imageBase64: string): Promise<SafetyAnalysisResult> {
    try {
      if (!API_KEY || API_KEY.length < 10) {
        throw new Error('Gemini API key not configured');
      }

      // Advanced safety analysis prompt for construction sites
      const safetyPrompt = `
As an expert construction safety AI with OSHA compliance knowledge, analyze this image for:

SAFETY VIOLATIONS & HAZARDS:
- Fall protection compliance (guardrails, harnesses, PFAS)  
- PPE usage (hard hats, safety vests, steel toes, eye protection)
- Electrical hazards (exposed wiring, improper grounding)
- Equipment safety (crane positioning, scaffolding stability)
- Housekeeping issues (debris, trip hazards, storage)
- Chemical/material handling safety
- Work zone protection and signage

OBJECT DETECTION FOCUS:
- Workers and their PPE status
- Heavy equipment and machinery
- Safety barriers and protection systems
- Hazardous materials or conditions
- Tools and equipment placement

RISK ASSESSMENT:
Provide overall risk score (0-100, where 100 = critical danger)

COMPLIANCE CHECK:
- OSHA 1926 construction standards
- Fall protection requirements  
- PPE regulations
- Equipment safety protocols

ACTIONABLE RECOMMENDATIONS:
- Immediate safety actions needed
- PPE corrections required
- Hazard mitigation steps
- Compliance improvements

Return structured analysis with specific findings and recommendations.
      `;

      // Use new Gemini 2.5-flash model with enhanced vision
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: safetyPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1] // Remove data URL prefix
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7, // Balanced for accuracy
          maxOutputTokens: 4096
        }
      });

      const analysisText = response.text;
      
      // Enhanced object detection for safety equipment
      const objectDetectionResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { 
                text: `Detect and locate all safety-related objects in this construction image. Focus on:
                - Workers (with/without PPE)
                - Hard hats, safety vests, boots
                - Heavy equipment, cranes, scaffolding  
                - Safety barriers, signs, cones
                - Hazardous materials or conditions
                
                Return JSON with object labels and bounding box coordinates [x0,y0,x1,y1] scaled 0-1000.`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1]
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Low for precise detection
          maxOutputTokens: 2048
        }
      });

      // Parse the analysis and create structured result
      return this.parseAnalysisResult(analysisText, objectDetectionResponse.text);
      
    } catch (error) {
      console.error('Modern Gemini Vision error:', error);
      throw new Error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseAnalysisResult(analysisText: string, objectData: string): SafetyAnalysisResult {
    // Extract key information from the AI response
    const riskScoreMatch = analysisText.match(/risk.*?score.*?(\d+)/i);
    const overallRiskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50;
    
    // Parse object detection (if valid JSON returned)
    let detectedObjects: ObjectDetection[] = [];
    try {
      const objectJson = JSON.parse(objectData);
      if (Array.isArray(objectJson)) {
        detectedObjects = objectJson.map(obj => ({
          label: obj.label || 'Unknown object',
          confidence: obj.confidence || 0.8,
          boundingBox: {
            x0: obj.box?.[0] || 0,
            y0: obj.box?.[1] || 0, 
            x1: obj.box?.[2] || 100,
            y1: obj.box?.[3] || 100
          }
        }));
      }
    } catch (e) {
      // Fallback if object detection doesn't return valid JSON
      console.log('Object detection parsing failed, using text analysis');
    }

    // Extract safety findings from text analysis
    const violations = this.extractViolations(analysisText);
    const hazards = this.extractHazards(analysisText);
    const recommendations = this.extractRecommendations(analysisText);
    const ppeStatus = this.extractPPECompliance(analysisText);

    return {
      overallRiskScore,
      detectedObjects,
      safetyViolations: violations,
      ppeCompliance: ppeStatus,
      hazards,
      recommendations,
      visualAnalysis: analysisText
    };
  }

  private extractViolations(text: string): string[] {
    const violations: string[] = [];
    const violationKeywords = [
      'not wearing', 'missing', 'improper', 'violation', 'unsafe', 
      'hazard', 'risk', 'danger', 'exposed', 'unprotected'
    ];
    
    const sentences = text.split(/[.!?\n]+/);
    sentences.forEach(sentence => {
      if (violationKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword))) {
        violations.push(sentence.trim());
      }
    });
    
    return violations.slice(0, 10); // Limit results
  }

  private extractHazards(text: string): string[] {
    const hazards: string[] = [];
    const hazardPatterns = [
      /fall\s+hazard/gi,
      /electrical\s+hazard/gi,
      /struck.by/gi,
      /caught.between/gi,
      /chemical\s+exposure/gi,
      /trip\s+hazard/gi,
      /overhead\s+hazard/gi
    ];
    
    hazardPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        hazards.push(...matches.map(m => m.trim()));
      }
    });
    
    return [...new Set(hazards)]; // Remove duplicates
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const sections = text.split(/recommendation|action|improve|should/gi);
    
    sections.slice(1).forEach(section => {
      const lines = section.split(/[.!?\n]+/).slice(0, 3);
      lines.forEach(line => {
        if (line.trim().length > 10) {
          recommendations.push(line.trim());
        }
      });
    });
    
    return recommendations.slice(0, 8);
  }

  private extractPPECompliance(text: string): SafetyAnalysisResult['ppeCompliance'] {
    const lowerText = text.toLowerCase();
    
    return {
      hardHats: !lowerText.includes('no hard hat') && !lowerText.includes('missing hard hat'),
      safetyVests: !lowerText.includes('no safety vest') && !lowerText.includes('missing vest'),
      steelToes: !lowerText.includes('improper footwear') && !lowerText.includes('no steel'),
      eyeProtection: !lowerText.includes('no eye protection') && !lowerText.includes('missing glasses')
    };
  }

  // Quick image analysis for immediate feedback
  async quickSafetyCheck(imageBase64: string): Promise<string> {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: "Quick safety assessment: Are there any immediate safety violations or hazards visible in this construction site image? Focus on PPE compliance and obvious dangers." },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1]
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 500
        }
      });

      return response.text;
    } catch (error) {
      return `Quick analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export const modernGeminiVision = new ModernGeminiVisionService();