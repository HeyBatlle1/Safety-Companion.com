import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveAnalysisToHistory } from '../../services/history';

// Initialize Gemini with API key from env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export class SafetyConnector {
  private modelName: string = "gemini-2.5-flash";
  private temperature: number = 1.0;
  private maxTokens: number = 2000;
  private initialized: boolean = false;
  private retryDelay: number = 1000; // Initial retry delay in ms

  constructor() {
    // Validate configuration on initialization
    this.initialized = this.validateConfiguration();
  }

  private validateConfiguration(): boolean {
    if (!API_KEY || API_KEY.length < 10) {
      
      return false;
    }
    return true;
  }

  async generateContent(prompt: string): Promise<{ response: { text: () => string } }> {
    try {
      if (!this.initialized) {
        
        return this.getFallbackResponse('Configuration error: API service unavailable.');
      }
      
      if (!prompt || prompt.trim().length === 0) {
        return this.getFallbackResponse('Empty prompt received. Please provide detailed safety information for assessment.');
      }

      const model = genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature
        }
      });
      
      // Add retries for network resilience
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;
      
      while (attempts < maxAttempts) {
        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          // Only save to history if we have a valid response
          if (text && text.length > 0) {
            try {
              await saveAnalysisToHistory({
                query: prompt,
                response: text,
                type: 'safety_assessment',
                metadata: {
                  model: this.modelName,
                  temperature: this.temperature,
                  maxTokens: this.maxTokens,
                  attempts: attempts + 1
                }
              });
            } catch (historyError) {
              
              // Continue even if history saving fails
            }
          }
          
          return {
            response: {
              text: () => text
            }
          };
        } catch (error) {
          lastError = error;
          
          attempts++;
          
          // Wait before retry with exponential backoff
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            this.retryDelay *= 2; // Exponential backoff
          }
        }
      }
      
      
      return this.getFallbackResponse('Unable to generate safety assessment after multiple attempts.');
    } catch (error) {
      
      return this.getFallbackResponse('An unexpected error occurred while analyzing safety data.');
    }
  }
  
  // Helper method to create a fallback response
  private getFallbackResponse(message: string): { response: { text: () => string } } {
    const fallbackMessage = `${message}

As a fallback, here's a general safety assessment:

- Always wear appropriate PPE including hard hat, safety glasses, and high-visibility clothing
- Maintain clear communication with all team members
- Inspect all equipment before use
- Follow established safety protocols
- Report any hazards immediately
- Never take shortcuts that compromise safety
- Take regular breaks to prevent fatigue

Please try again with more specific information for a detailed assessment.`;

    return {
      response: {
        text: () => fallbackMessage
      }
    };
  }
  
  // Get model configuration
  getModelConfig() {
    return {
      model: this.modelName,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }
  
  // Update model configuration
  updateModelConfig(config: {
    temperature?: number;
    maxTokens?: number;
  }) {
    if (config.temperature !== undefined) {
      this.temperature = config.temperature;
    }
    
    if (config.maxTokens !== undefined) {
      this.maxTokens = config.maxTokens;
    }
    
    return this.getModelConfig();
  }
}