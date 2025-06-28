export interface Drawing {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  drawing_number?: string;
  discipline: 'architectural' | 'structural' | 'mechanical' | 'electrical' | 'plumbing' | 'civil' | 'other';
  current_version: number;
  status: 'draft' | 'review' | 'approved' | 'superseded' | 'archived';
  uploaded_by: string;
  created_at: string;
  updated_at?: string;
}

export interface DrawingVersion {
  id: string;
  drawing_id: string;
  version_number: number;
  revision_letter?: string;
  file_url: string;
  file_size: number;
  changes_description?: string;
  uploaded_by: string;
  upload_date: string;
  is_current: boolean;
}

export interface DrawingAnnotation {
  id: string;
  drawing_id: string;
  version_id?: string;
  user_id: string;
  annotation_type: 'markup' | 'comment' | 'measurement' | 'highlight' | 'shape';
  content: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  color?: string;
  stroke_width?: number;
  is_resolved: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DrawingCollaboration {
  id: string;
  drawing_id: string;
  user_id: string;
  action: 'viewed' | 'annotated' | 'commented' | 'approved' | 'rejected';
  timestamp: string;
  details?: string;
}

export interface DrawingFolder {
  id: string;
  project_id?: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ProCoreSync {
  id: string;
  drawing_id: string;
  procore_drawing_id?: string;
  last_sync: string;
  sync_status: 'pending' | 'synced' | 'error' | 'conflict';
  error_message?: string;
}