import { SafetyReport } from '../types/safety';

const API_BASE = '/api';

// Helper function to get reports from localStorage
const getLocalReports = (): SafetyReport[] => {
  try {
    const reportsJSON = localStorage.getItem('safety-companion-reports');
    if (!reportsJSON) {
      return [];
    }
    const reports = JSON.parse(reportsJSON);
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error('Error reading local reports:', error);
    return [];
  }
};

// Helper function to save reports to localStorage
const saveLocalReports = (reports: SafetyReport[]): void => {
  try {
    localStorage.setItem('safety-companion-reports', JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving local reports:', error);
  }
};

// Get all safety reports
export const getAllReports = async (): Promise<SafetyReport[]> => {
  try {
    // For now, use localStorage as the backend endpoint isn't implemented yet
    // TODO: Replace with API call when backend endpoint is ready
    return getLocalReports();
  } catch (error) {
    console.error('Error getting reports:', error);
    return getLocalReports();
  }
};

// Add a new safety report
export const addReport = async (reportData: {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location?: string;
  attachments: SafetyReport['attachments'];
}): Promise<SafetyReport> => {
  try {
    // Create new report
    const newReport: SafetyReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...reportData,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage (until backend endpoint is implemented)
    const existingReports = getLocalReports();
    const updatedReports = [newReport, ...existingReports];
    saveLocalReports(updatedReports);

    return newReport;
  } catch (error) {
    console.error('Error adding report:', error);
    throw new Error('Failed to add report');
  }
};

// Delete a safety report
export const deleteReport = async (id: string): Promise<boolean> => {
  try {
    const existingReports = getLocalReports();
    const filteredReports = existingReports.filter(report => report.id !== id);
    
    if (filteredReports.length === existingReports.length) {
      return false; // Report not found
    }
    
    saveLocalReports(filteredReports);
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    return false;
  }
};

// Process files for report attachments
export const processReportFiles = async (files: File[]): Promise<SafetyReport['attachments']> => {
  const attachments: SafetyReport['attachments'] = [];
  
  for (const file of files) {
    try {
      // For now, create data URLs for images (until cloud storage is implemented)
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        attachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: dataUrl
        });
      } else {
        // For non-image files, just store metadata
        attachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: '' // No preview for non-images
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  return attachments;
};