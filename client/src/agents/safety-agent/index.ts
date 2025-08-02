import { SafetyAgent } from './SafetyAgent';
import { DataCollector } from './DataCollector';
import { RiskProcessor } from './RiskProcessor';
import { SafetyConnector } from './GeminiConnector';
import { DatabaseHandler } from './DatabaseHandler';

// Export all components
export {
  SafetyAgent,
  DataCollector,
  RiskProcessor,
  SafetyConnector,
  DatabaseHandler
};

// Create and export a singleton instance
const safetyAgent = new SafetyAgent();
export default safetyAgent;