import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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

    // Use gemini-pro-vision for multi-modal analysis when visual data is present
    const modelName = visualData && visualData.length > 0 
      ? "gemini-pro-vision" 
      : "gemini-2.0-flash";

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,  // Optimized for professional safety analysis
        maxOutputTokens: 2000  // Consistent with other services
      }
    });

    // Prepare content for multi-modal analysis
    const content = [];
    
    // Add the text prompt
    content.push({ text: prompt });

    // Add visual data if available
    if (visualData && visualData.length > 0) {
      for (const visual of visualData) {
        if (visual.type === 'photo' && visual.data) {
          // Handle base64 images
          const base64Data = visual.data.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          content.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          });
        } else if (visual.type === 'blueprint' && visual.url) {
          // For blueprints stored in Supabase, we'd need to fetch and convert
          // For now, include URL reference in the prompt
          content.push({ 
            text: `\n[Blueprint: ${visual.metadata?.fileName || 'Blueprint'} at ${visual.url}]\n` 
          });
        }
      }
    }

    // Generate response
    const result = await model.generateContent(content);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Fallback response
    return `Unable to complete AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure all required API keys are configured.`;
  }
}