import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveAnalysisToHistory } from './history';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 2000,
    temperature: 1.0
  }
});

export const getMSDSResponse = async (message: string): Promise<string> => {
  try {
    // Validate input
    if (!message || message.trim() === '') {
      return "I didn't receive a message to respond to. Please ask a specific question about chemical safety or SDS information.";
    }
    
    // Create a comprehensive safety-focused prompt with enhanced context
    const safetyPrompt = `You are an expert Safety Data Sheet (SDS) specialist and chemical safety consultant with extensive knowledge of:
- OSHA regulations and compliance requirements
- Chemical hazard identification and classification
- Proper handling, storage, and disposal of hazardous materials
- Personal protective equipment (PPE) requirements
- Emergency response procedures
- Workplace safety protocols
- Regulatory compliance (OSHA, EPA, DOT)

When analyzing the following query, provide accurate, detailed information focused on:
1. Chemical safety and hazard information
2. Regulatory compliance requirements
3. Proper handling and storage procedures
4. PPE and safety equipment recommendations
5. Emergency response protocols
6. Risk assessment and mitigation strategies

Query: ${message}

Please provide a comprehensive, professional response that includes:
- Clear safety recommendations
- Specific regulatory references when applicable
- Practical implementation guidance
- Risk mitigation strategies

If the query is not related to chemical safety or workplace safety, politely redirect to safety topics while offering to help with safety-related questions.

Format your response in a clear, professional manner with proper sections and bullet points where appropriate.`;
    
    // Get response from Gemini
    const result = await model.generateContent(safetyPrompt);
    const response = result.response;
    const text = response.text();
    
    // Save to analysis history
    try {
      await saveAnalysisToHistory({
        query: message,
        response: text,
        type: 'sds_analysis',
        metadata: {
          model: 'gemini-2.0-flash',
          temperature: 1.0,
          maxTokens: 2000
        }
      });
    } catch (historyError) {
      
    }
    
    return text;
    
  } catch (error) {
    
    return "I apologize, but I'm experiencing technical difficulties processing your chemical safety inquiry. Please try again in a few moments, or contact your safety supervisor for immediate assistance.";
  }
};

// Function to get stored analyses for context
export const getStoredAnalyses = (): any[] => {
  // This function is deprecated - use getAnalysisHistory from history/analysisHistory.ts instead
  
  return [];
};

// Function to clear stored analyses
export const clearStoredAnalyses = (): void => {
  // This function is deprecated - use clearAnalysisHistory from history/analysisHistory.ts instead
  
};

// Get information about the MSDS model being used
export const getMSDSModelInfo = () => {
  return {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    temperature: 1.0,
    maxTokens: 2000,
    capabilities: [
      'Chemical safety analysis',
      'SDS interpretation',
      'Hazard identification',
      'PPE recommendations',
      'Emergency response guidance',
      'Regulatory compliance'
    ]
  };
};