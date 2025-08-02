export interface UserProfile {
  id: string;
  company_id?: string;
  role: 'admin' | 'project_manager' | 'field_worker';
  first_name?: string;
  last_name?: string;
  phone?: string;
  employee_id?: string;
  hire_date?: string;
  department?: string;
  supervisor_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  company_id?: string;
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface UserProjectAssignment {
  id: string;
  user_id: string;
  project_id: string;
  assigned_by?: string;
  assigned_at: string;
  role_on_project: 'manager' | 'supervisor' | 'worker';
  is_active: boolean;
}

export interface DrugScreen {
  id: string;
  user_id: string;
  test_date: string;
  test_type: 'pre_employment' | 'random' | 'post_incident' | 'return_to_duty' | 'follow_up';
  result: 'pending' | 'passed' | 'failed' | 'cancelled';
  testing_facility?: string;
  chain_of_custody_number?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserCertification {
  id: string;
  user_id: string;
  certification_name: string;
  certification_type?: 'safety' | 'trade' | 'license' | 'training';
  issuing_authority: string;
  certification_number?: string;
  issue_date: string;
  expiry_date?: string;
  renewal_required: boolean;
  renewal_period_months?: number;
  certificate_file_url?: string;
  verification_url?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  created_at: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  certification_expiry_alerts?: boolean;
  certification_alert_days?: number;
  drug_screen_reminders?: boolean;
  safety_alerts?: boolean;
  project_updates?: boolean;
  training_reminders?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  id: string;
  role: string;
  resource: string;
  action: string;
  scope: 'own' | 'team' | 'company' | 'all';
  created_at: string;
}

export interface CertificationExpiryAlert {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
  certification_name: string;
  expiry_date: string;
  days_until_expiry: number;
  certification_alert_days: number;
}