import { SafetyReport } from '../types/safety';
import supabase, { getCurrentUser } from './supabase';

// Get all safety reports
export const getAllReports = async (): Promise<SafetyReport[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      // Handle unauthenticated users gracefully - return empty array instead of throwing
      console.log('User not authenticated, using local storage for safety reports');
      return getLocalReports();
    }
    
    const { data, error } = await supabase
      .from('safety_reports')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }
    
    // If no data, return empty array
    if (!data || data.length === 0) {
      return getLocalReports();
    }
    
    // Transform from database format to application format
    return data.map(report => ({
      id: report.id,
      severity: report.severity as 'low' | 'medium' | 'high' | 'critical',
      category: report.category,
      description: report.description,
      attachments: report.attachments as SafetyReport['attachments'],
      submittedAt: report.created_at,
      status: report.status as 'pending' | 'investigating' | 'resolved',
      location: report.location || undefined,
      lastUpdated: report.updated_at || undefined
    }));
  } catch (error) {
    console.error('Error retrieving safety reports:', error);
    
    // Always return reports from localStorage if Supabase fails
    return getLocalReports();
  }
};

// Helper function to get reports from localStorage
const getLocalReports = (): SafetyReport[] => {
  try {
    const reportsJSON = localStorage.getItem('safety-companion-reports');
    if (!reportsJSON) {
      // Initialize empty reports array in localStorage if it doesn't exist
      localStorage.setItem('safety-companion-reports', JSON.stringify([]));
      return [];
    }
    return JSON.parse(reportsJSON);
  } catch (localError) {
    console.error('Error accessing localStorage:', localError);
    return [];
  }
};

// Get a single report by ID
export const getReportById = async (id: string): Promise<SafetyReport | undefined> => {
  try {
    const { data, error } = await supabase
      .from('safety_reports')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }
    
    if (!data) return undefined;
    
    return {
      id: data.id,
      severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
      category: data.category,
      description: data.description,
      attachments: data.attachments as SafetyReport['attachments'],
      submittedAt: data.created_at,
      status: data.status as 'pending' | 'investigating' | 'resolved',
      location: data.location || undefined,
      lastUpdated: data.updated_at || undefined
    };
  } catch (error) {
    console.error('Error retrieving report by ID:', error);
    
    // Fallback to localStorage if Supabase fails
    try {
      const reports = getLocalReports();
      return reports.find(report => report.id === id);
    } catch (localError) {
      console.error('Error retrieving from localStorage:', localError);
      return undefined;
    }
  }
};

// Add a new safety report
export const addReport = async (reportData: Omit<SafetyReport, 'id' | 'submittedAt' | 'status'>): Promise<SafetyReport> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      // If not authenticated, fallback to localStorage only
      return addLocalReport(reportData);
    }
    
    const { data, error } = await supabase
      .from('safety_reports')
      .insert([{
        user_id: user.id,
        severity: reportData.severity,
        category: reportData.category,
        description: reportData.description,
        location: reportData.location,
        attachments: reportData.attachments,
        status: 'pending'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase insertion error:', error.message);
      throw error;
    }
    
    return {
      id: data.id,
      severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
      category: data.category,
      description: data.description,
      attachments: data.attachments as SafetyReport['attachments'],
      submittedAt: data.created_at,
      status: data.status as 'pending' | 'investigating' | 'resolved',
      location: data.location || undefined
    };
  } catch (error) {
    console.error('Error adding safety report to Supabase:', error);
    
    // Fallback to localStorage
    return addLocalReport(reportData);
  }
};

// Helper function to add a report to localStorage
const addLocalReport = (reportData: Omit<SafetyReport, 'id' | 'submittedAt' | 'status'>): SafetyReport => {
  // Create a new report with generated ID and timestamps
  const newReport: SafetyReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    ...reportData
  };

  // Get existing reports and add the new one
  const reports = getLocalReports();
  reports.unshift(newReport); // Add to beginning of array

  // Save back to localStorage
  localStorage.setItem('safety-companion-reports', JSON.stringify(reports));

  return newReport;
};

// Update an existing report
export const updateReport = async (id: string, updatedData: Partial<SafetyReport>): Promise<SafetyReport> => {
  try {
    // Prepare data for Supabase update (transforming from app format to DB format)
    const updateObj: any = {};
    
    if (updatedData.severity) updateObj.severity = updatedData.severity;
    if (updatedData.category) updateObj.category = updatedData.category;
    if (updatedData.description) updateObj.description = updatedData.description;
    if (updatedData.status) updateObj.status = updatedData.status;
    if (updatedData.location) updateObj.location = updatedData.location;
    if (updatedData.attachments) updateObj.attachments = updatedData.attachments;
    
    // Always update the updated_at timestamp
    updateObj.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('safety_reports')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase update error:', error.message);
      throw error;
    }
    
    return {
      id: data.id,
      severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
      category: data.category,
      description: data.description,
      attachments: data.attachments as SafetyReport['attachments'],
      submittedAt: data.created_at,
      status: data.status as 'pending' | 'investigating' | 'resolved',
      location: data.location || undefined,
      lastUpdated: data.updated_at || undefined
    };
  } catch (error) {
    console.error('Error updating safety report in Supabase:', error);
    
    // Fallback to localStorage if Supabase fails
    const reports = getLocalReports();
    const reportIndex = reports.findIndex(report => report.id === id);

    if (reportIndex === -1) {
      throw new Error(`Report with ID ${id} not found`);
    }

    // Update the report
    reports[reportIndex] = {
      ...reports[reportIndex],
      ...updatedData,
      lastUpdated: new Date().toISOString()
    };

    // Save back to localStorage
    localStorage.setItem('safety-companion-reports', JSON.stringify(reports));

    return reports[reportIndex];
  }
};

// Delete a report
export const deleteReport = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('safety_reports')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Supabase deletion error:', error.message);
      throw error;
    }
    
    // Also remove from localStorage if it exists there
    removeLocalReport(id);
    
    return true;
  } catch (error) {
    console.error('Error deleting safety report from Supabase:', error);
    
    // Fallback to localStorage if Supabase fails
    return removeLocalReport(id);
  }
};

// Helper function to remove a report from localStorage
const removeLocalReport = (id: string): boolean => {
  try {
    const reports = getLocalReports();
    const filteredReports = reports.filter(report => report.id !== id);

    if (filteredReports.length === reports.length) {
      return false; // No report was removed
    }

    // Save back to localStorage
    localStorage.setItem('safety-companion-reports', JSON.stringify(filteredReports));
    return true;
  } catch (localError) {
    console.error('Error deleting report from localStorage:', localError);
    return false;
  }
};

// Process file uploads for safety reports
export const processReportFiles = async (files: File[]): Promise<
  Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>
> => {
  if (!files || files.length === 0) return [];

  return Promise.all(
    files.map(
      (file) =>
        new Promise<{
          name: string;
          type: string;
          url: string;
          size: number;
        }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              url: reader.result as string,
              size: file.size
            });
          };
          reader.readAsDataURL(file);
        })
    )
  );
};