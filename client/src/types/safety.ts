export interface SiteData {
  weather: WeatherData;
  forecast: WeatherData[];
  location: SiteLocation;
  tasks: Task[];
  recentIncidents: any[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  alerts?: string[];
}

export interface SiteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: string;
  restrictions?: string[];
  notes?: string;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string[];
  equipment?: string[];
  hazards?: string[];
  safetyRequirements?: string[];
}

export interface RiskAssessment {
  risks: {
    description: string;
    severity: number;
    probability: number;
    score: number;
    mitigation: string[];
    standards: string[];
  }[];
  recommendations: string[];
  requiredPPE: string[];
  weatherImpact: string[];
}

export interface SafetyReport {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  attachments?: {
    name: string;
    type: string;
    url: string;
    size?: number;
  }[];
  submittedAt: string;
  status: 'pending' | 'investigating' | 'resolved';
  location?: string;
  assignedTo?: string;
  lastUpdated?: string;
}