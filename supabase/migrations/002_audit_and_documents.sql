/*
  # Step 2: Audit Trail and Document Management
  
  Run this AFTER step 1 completes successfully
*/

-- Audit trail table for complete security logging
CREATE TABLE IF NOT EXISTS profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  changed_by UUID, -- References auth.users but nullable for system changes
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  reason TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Secure document management table
CREATE TABLE IF NOT EXISTS profile_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('certification', 'id_document', 'profile_photo', 'emergency_contact', 'safety_record', 'training_certificate', 'other')),
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT, -- SHA-256 hash for integrity checking
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error', 'quarantined')),
  virus_scan_date TIMESTAMPTZ,
  virus_scan_engine TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')),
  approval_date TIMESTAMPTZ,
  expiry_date DATE, -- For certifications
  expiry_warning_sent BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_confidential BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'normal' CHECK (access_level IN ('public', 'normal', 'confidential', 'restricted')),
  download_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced session management table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_country TEXT,
  location_city TEXT,
  location_coordinates POINT,
  is_active BOOLEAN DEFAULT true,
  is_suspicious BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  login_method TEXT DEFAULT 'email' CHECK (login_method IN ('email', 'sso', 'admin', 'mobile', 'api')),
  two_factor_verified BOOLEAN DEFAULT false,
  device_trusted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User project assignments for granular access control
CREATE TABLE IF NOT EXISTS user_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID, -- References projects table when created
  role_on_project TEXT CHECK (role_on_project IN ('manager', 'supervisor', 'worker', 'observer')),
  assigned_by UUID REFERENCES auth.users(id),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Apply updated_at triggers
CREATE TRIGGER update_profile_documents_updated_at 
    BEFORE UPDATE ON profile_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();