import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

interface AnalysisParams {
  prompt: string;
  visualData?: any[];
  context?: string;
}

export async function analyzeWithGemini(params: AnalysisParams | string): Promise<string> {
  try {
    // Handle both string and object parameters for backward compatibility
    const analysisParams: AnalysisParams = typeof params === 'string' 
      ? { prompt: params } 
      : params;

    const { prompt, visualData, context } = analysisParams;

    if (!API_KEY || API_KEY.length < 10) {
      throw new Error('Gemini API key not configured');
    }

    // Use gemini-2.5-flash for all analysis (supports both text and vision)
    const modelName = "gemini-2.5-flash";

    // Prepare content for multi-modal analysis
    const parts = [];
    
    // Add the text prompt
    parts.push({ text: prompt });

    // Add visual data if available
    if (visualData && visualData.length > 0) {
      for (const visual of visualData) {
        if (visual.type === 'photo' && visual.data) {
          // Handle base64 images
          const base64Data = visual.data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          });
        } else if (visual.type === 'blueprint' && visual.url) {
          // For blueprints stored in Supabase, we'd need to fetch and convert
          // For now, include URL reference in the prompt
          parts.push({ 
            text: `\n[Blueprint: ${visual.metadata?.fileName || 'Blueprint'} at ${visual.url}]\n` 
          });
        }
      }
    }

    // Generate response with new SDK
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 4096
      }
    });

    const text = result.response.text();

    return text;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Fallback response
    return `Unable to complete AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure all required API keys are configured.`;
  }
}