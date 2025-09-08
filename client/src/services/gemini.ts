import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveAnalysisToHistory } from './history';

// Initialize Gemini with API key from env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Create a singleton instance of GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(API_KEY);

// Configuration for Gemini model - optimized for professional safety analysis
const MODEL_CONFIG = {
  modelName: "gemini-2.5-flash",
  temperature: 0.8,  // Optimized for focused, professional safety recommendations
  maxOutputTokens: 2000
};

export const getChatResponse = async (message: string): Promise<string> => {
  try {
    // Validate input
    if (!message || message.trim() === '') {
      return "I didn't receive a message to respond to. Please try again.";
    }
    
    // Validate API key
    if (!API_KEY || API_KEY.length < 10) {
      
      return "I'm unable to process your request due to a configuration issue. Please contact support.";
    }
    
    // Initialize Gemini model with configuration
    const model = genAI.getGenerativeModel({ 
      model: MODEL_CONFIG.modelName,
      generationConfig: {
        temperature: MODEL_CONFIG.temperature,
        maxOutputTokens: MODEL_CONFIG.maxOutputTokens
      }
    });
    
    // Create a safety-focused prompt
    const safetyPrompt = `You are an expert safety consultant with a focus on construction safety, OSHA regulations, and workplace hazard prevention. Please analyze and respond to the following message with accurate safety information and practical advice:

${message}

If the question isn't related to safety, politely redirect to safety topics. Format your response clearly and professionally.`;
    
    try {
      // Add retries for resilience
      let attempts = 0;
      const maxAttempts = 3;
      let retryDelay = 1000; // Start with 1 second delay
      let lastError;
      
      while (attempts < maxAttempts) {
        try {
          // Direct query to Gemini Pro
          const result = await model.generateContent(safetyPrompt);
          const response = result.response;
          const text = response.text();
          
          // Save to analysis history if successful
          try {
            await saveAnalysisToHistory({
              query: message,
              response: text,
              type: 'chat_response',
              metadata: {
                model: MODEL_CONFIG.modelName,
                temperature: MODEL_CONFIG.temperature,
                maxTokens: MODEL_CONFIG.maxOutputTokens,
                attempts: attempts + 1
              }
            });
          } catch (historyError) {
            
            // Continue even if saving to history fails
          }
          
          return text;
        } catch (error) {
          lastError = error;
          
          attempts++;
          
          // Wait with exponential backoff before retry
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Exponential backoff
          }
        }
      }
      
      
      
      // Provide a fallback response
      return "I'm currently having trouble processing your request. This could be due to high demand or a temporary issue with my language processing capabilities. Could you please try again with a simpler request, or try again in a few moments?";
    } catch (modelError) {
      
      
      // Provide a fallback response
      return "I'm currently having trouble processing your request. This could be due to high demand or a temporary issue with my language processing capabilities. Could you please try again with a simpler request, or try again in a few moments?";
    }
  } catch (error) {
    
    return "I apologize, but I'm experiencing an unexpected technical difficulty. Please try again in a few moments.";
  }
};

// Get information about the Gemini model being used
export const getGeminiModelInfo = () => {
  return {
    name: MODEL_CONFIG.modelName,
    provider: 'Google',
    temperature: MODEL_CONFIG.temperature,
    maxTokens: MODEL_CONFIG.maxOutputTokens,
    capabilities: [
      'Safety assessment',
      'OSHA compliance guidance',
      'Hazard identification',
      'Risk mitigation strategies',
      'Workplace safety recommendations'
    ]
  };
};

// Check if the Gemini API is configured and available
export const checkGeminiAvailability = async (): Promise<boolean> => {
  if (!API_KEY || API_KEY.length < 10) {
    return false;
  }
  
  try {
    // Make a simple test call
    const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.modelName });
    const result = await model.generateContent("Hello");
    return result.response.text().length > 0;
  } catch (error) {
    
    return false;
  }
};

export default {
  getChatResponse,
  getGeminiModelInfo,
  checkGeminiAvailability,
  MODEL_CONFIG
};