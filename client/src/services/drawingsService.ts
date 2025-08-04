// Mock service for drawings - no external dependencies
import { 
  Drawing, 
  DrawingVersion, 
  DrawingAnnotation, 
  DrawingCollaboration, 
  DrawingFolder,
  ProCoreSync 
} from '../types/drawings';

// Mock data for development
const mockDrawings: Drawing[] = [
  {
    id: '1',
    project_id: 'proj-1',
    title: 'Foundation Plan - Level B1',
    description: 'Basement foundation layout with structural details',
    file_name: 'A-001_Foundation_Plan_Rev_C.pdf',
    file_url: '/mock-drawings/foundation-plan.pdf',
    file_size: 2048576,
    file_type: 'application/pdf',
    drawing_number: 'A-001',
    discipline: 'architectural',
    current_version: 3,
    status: 'approved',
    uploaded_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    project_id: 'proj-1',
    title: 'Electrical Layout - Ground Floor',
    description: 'Main electrical distribution and lighting layout',
    file_name: 'E-101_Electrical_Layout_Rev_B.pdf',
    file_url: '/mock-drawings/electrical-layout.pdf',
    file_size: 1536000,
    file_type: 'application/pdf',
    drawing_number: 'E-101',
    discipline: 'electrical',
    current_version: 2,
    status: 'review',
    uploaded_by: 'user-2',
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    project_id: 'proj-1',
    title: 'HVAC System Layout',
    description: 'Mechanical ventilation and air conditioning layout',
    file_name: 'M-201_HVAC_Layout_Rev_A.pdf',
    file_url: '/mock-drawings/hvac-layout.pdf',
    file_size: 3072000,
    file_type: 'application/pdf',
    drawing_number: 'M-201',
    discipline: 'mechanical',
    current_version: 1,
    status: 'draft',
    uploaded_by: 'user-3',
    created_at: '2024-01-25T09:15:00Z'
  }
];

const mockVersions: DrawingVersion[] = [
  {
    id: 'v1',
    drawing_id: '1',
    version_number: 3,
    revision_letter: 'C',
    file_url: '/mock-drawings/foundation-plan-rev-c.pdf',
    file_size: 2048576,
    changes_description: 'Updated foundation details per structural engineer comments',
    uploaded_by: 'user-1',
    upload_date: '2024-01-25T16:00:00Z',
    is_current: true
  },
  {
    id: 'v2',
    drawing_id: '1',
    version_number: 2,
    revision_letter: 'B',
    file_url: '/mock-drawings/foundation-plan-rev-b.pdf',
    file_size: 1998000,
    changes_description: 'Revised column locations',
    uploaded_by: 'user-1',
    upload_date: '2024-01-20T11:30:00Z',
    is_current: false
  }
];

const mockAnnotations: DrawingAnnotation[] = [
  {
    id: 'ann1',
    drawing_id: '1',
    version_id: 'v1',
    user_id: 'user-2',
    annotation_type: 'comment',
    content: 'Check foundation depth at grid line A-3',
    position_x: 150,
    position_y: 200,
    color: '#ff6b6b',
    is_resolved: false,
    created_at: '2024-01-26T10:15:00Z'
  },
  {
    id: 'ann2',
    drawing_id: '1',
    version_id: 'v1',
    user_id: 'user-3',
    annotation_type: 'markup',
    content: 'Dimension correction needed',
    position_x: 300,
    position_y: 150,
    width: 100,
    height: 50,
    color: '#4ecdc4',
    stroke_width: 2,
    is_resolved: true,
    created_at: '2024-01-26T14:20:00Z'
  }
];

// Drawing Management
export const getAllDrawings = async (projectId?: string): Promise<Drawing[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return mockDrawings;

    let query = supabase
      .from('drawings')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    
    if (error) {
      
      return mockDrawings;
    }
    
    return data || mockDrawings;
  } catch (error) {
    
    return mockDrawings;
  }
};

export const getDrawingById = async (drawingId: string): Promise<Drawing | null> => {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .eq('id', drawingId)
      .single();

    if (error) {
      
      return mockDrawings.find(d => d.id === drawingId) || null;
    }

    return data;
  } catch (error) {
    
    return mockDrawings.find(d => d.id === drawingId) || null;
  }
};

export const uploadDrawing = async (
  file: File,
  metadata: Omit<Drawing, 'id' | 'file_url' | 'file_size' | 'uploaded_by' | 'created_at' | 'updated_at'>
): Promise<Drawing | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // In a real implementation, upload file to storage
    const fileUrl = URL.createObjectURL(file);
    
    const drawingData = {
      ...metadata,
      file_url: fileUrl,
      file_size: file.size,
      uploaded_by: user.id
    };

    const { data, error } = await supabase
      .from('drawings')
      .insert([drawingData])
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};

export const updateDrawing = async (
  drawingId: string,
  updates: Partial<Drawing>
): Promise<Drawing | null> => {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', drawingId)
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};

// Version Management
export const getDrawingVersions = async (drawingId: string): Promise<DrawingVersion[]> => {
  try {
    const { data, error } = await supabase
      .from('drawing_versions')
      .select('*')
      .eq('drawing_id', drawingId)
      .order('version_number', { ascending: false });

    if (error) {
      
      return mockVersions.filter(v => v.drawing_id === drawingId);
    }

    return data || mockVersions.filter(v => v.drawing_id === drawingId);
  } catch (error) {
    
    return mockVersions.filter(v => v.drawing_id === drawingId);
  }
};

export const createNewVersion = async (
  drawingId: string,
  file: File,
  changesDescription?: string
): Promise<DrawingVersion | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get current version number
    const versions = await getDrawingVersions(drawingId);
    const nextVersion = Math.max(...versions.map(v => v.version_number), 0) + 1;

    const versionData = {
      drawing_id: drawingId,
      version_number: nextVersion,
      file_url: URL.createObjectURL(file),
      file_size: file.size,
      changes_description: changesDescription,
      uploaded_by: user.id,
      is_current: true
    };

    // Mark other versions as not current
    await supabase
      .from('drawing_versions')
      .update({ is_current: false })
      .eq('drawing_id', drawingId);

    const { data, error } = await supabase
      .from('drawing_versions')
      .insert([versionData])
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};

// Annotation Management
export const getDrawingAnnotations = async (drawingId: string, versionId?: string): Promise<DrawingAnnotation[]> => {
  try {
    let query = supabase
      .from('drawing_annotations')
      .select('*')
      .eq('drawing_id', drawingId);

    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      
      return mockAnnotations.filter(a => a.drawing_id === drawingId);
    }

    return data || mockAnnotations.filter(a => a.drawing_id === drawingId);
  } catch (error) {
    
    return mockAnnotations.filter(a => a.drawing_id === drawingId);
  }
};

export const addAnnotation = async (
  annotation: Omit<DrawingAnnotation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<DrawingAnnotation | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const annotationData = {
      ...annotation,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('drawing_annotations')
      .insert([annotationData])
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};

export const updateAnnotation = async (
  annotationId: string,
  updates: Partial<DrawingAnnotation>
): Promise<DrawingAnnotation | null> => {
  try {
    const { data, error } = await supabase
      .from('drawing_annotations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', annotationId)
      .select()
      .single();

    if (error) {
      
      throw error;
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};

// Collaboration Tracking
export const trackDrawingActivity = async (
  drawingId: string,
  action: DrawingCollaboration['action'],
  details?: string
): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const activityData = {
      drawing_id: drawingId,
      user_id: user.id,
      action,
      details
    };

    await supabase
      .from('drawing_collaborations')
      .insert([activityData]);
  } catch (error) {
    
  }
};

export const getDrawingActivity = async (drawingId: string): Promise<DrawingCollaboration[]> => {
  try {
    const { data, error } = await supabase
      .from('drawing_collaborations')
      .select(`
        *,
        profiles(display_name)
      `)
      .eq('drawing_id', drawingId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      
      return [];
    }

    return data || [];
  } catch (error) {
    
    return [];
  }
};

// Folder Management
export const getDrawingFolders = async (projectId?: string): Promise<DrawingFolder[]> => {
  try {
    let query = supabase
      .from('drawing_folders')
      .select('*')
      .order('name');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      
      return [];
    }

    return data || [];
  } catch (error) {
    
    return [];
  }
};

// ProCore Integration (Mock)
export const syncWithProCore = async (drawingId: string): Promise<boolean> => {
  try {
    // Mock ProCore sync - in real implementation, this would call ProCore API

    
    const syncData = {
      drawing_id: drawingId,
      sync_status: 'synced' as const,
      last_sync: new Date().toISOString()
    };

    await supabase
      .from('procore_sync')
      .upsert([syncData]);

    return true;
  } catch (error) {
    
    return false;
  }
};

export const getProCoreSyncStatus = async (drawingId: string): Promise<ProCoreSync | null> => {
  try {
    const { data, error } = await supabase
      .from('procore_sync')
      .select('*')
      .eq('drawing_id', drawingId)
      .single();

    if (error) {
      
      return null;
    }

    return data;
  } catch (error) {
    
    return null;
  }
};

// Export functionality
export const exportDrawingWithAnnotations = async (drawingId: string): Promise<string> => {
  try {
    // Mock export - in real implementation, this would generate PDF with annotations

    return 'mock-export-url.pdf';
  } catch (error) {

    throw error;
  }
};

export default {
  getAllDrawings,
  getDrawingById,
  uploadDrawing,
  updateDrawing,
  getDrawingVersions,
  createNewVersion,
  getDrawingAnnotations,
  addAnnotation,
  updateAnnotation,
  trackDrawingActivity,
  getDrawingActivity,
  getDrawingFolders,
  syncWithProCore,
  getProCoreSyncStatus,
  exportDrawingWithAnnotations
};