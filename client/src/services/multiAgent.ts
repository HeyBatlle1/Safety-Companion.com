import axios from 'axios';

// Configuration from environment variables
const BOLT_MULTI_AGENT_URL = import.meta.env.VITE_BOLT_MULTI_AGENT_URL || 'https://your-bolt-app-url/api/trigger-assessment';
const API_KEY = import.meta.env.VITE_BOLT_API_KEY || 'your-shared-api-key';

export interface MultiAgentAssessmentData {
  location: string;
  constructionType: string;
  currentActivities: string;
  safetyData: any;
}

export async function triggerBoltSafetyAssessment(data: MultiAgentAssessmentData) {
  try {

    
    const response = await axios.post(
      BOLT_MULTI_AGENT_URL,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error triggering Bolt multi-agent assessment:', error);
    
    return {
      error: true,
      message: 'Failed to get multi-agent assessment',
      details: error instanceof Error ? error.message : 'Unknown error',
      partialData: (error as any).response?.data
    };
  }
}