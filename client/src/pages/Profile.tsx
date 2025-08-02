// Keep the existing imports
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Bell, 
  Award,
  Calendar,
  Building,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  Database
} from 'lucide-react';
// Auth removed - using Supabase directly
import { showToast } from '../components/common/ToastContainer';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserCertifications,
  getUserDrugScreens,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../services/profileService';
import { UserProfile, UserCertification, DrugScreen, NotificationPreferences } from '../types/profile';
import AdminPanel from '../components/profile/AdminPanel';
import GeneralSettingsModal from '../components/profile/GeneralSettingsModal';
import SecuritySettingsModal from '../components/profile/SecuritySettingsModal';
import NotificationsModal from '../components/profile/NotificationsModal';
import PrivacyModal from '../components/profile/PrivacyModal';
import ProfileDatabaseInfo from '../components/profile/ProfileDatabaseInfo';

const Profile: React.FC = () => {
  // Mock user for now - auth removed
  const user = { id: 'test-user', email: 'user@example.com' };
  const logout = async () => { };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [drugScreens, setDrugScreens] = useState<DrugScreen[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'debug'>('profile');
  
  // Modal states
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, certsData, drugsData, notifData] = await Promise.all([
        getUserProfile(),
        getUserCertifications(),
        getUserDrugScreens(),
        getNotificationPreferences()
      ]);
      
      setProfile(profileData);
      setCertifications(certsData);
      setDrugScreens(drugsData);
      setNotifications(notifData);
      
      if (profileData) {
        setEditForm(profileData);
      }
    } catch (error) {
      
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      
      showToast('Failed to sign out', 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await updateUserProfile(editForm);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setEditing(false);
        showToast('Profile updated successfully', 'success');
      }
    } catch (error) {
      
      showToast('Failed to update profile', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditForm(profile || {});
    setEditing(false);
  };

  const getCertificationStatus = (cert: UserCertification) => {
    if (!cert.expiry_date) return { status: 'active', color: 'text-green-600' };
    
    const expiryDate = new Date(cert.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'text-red-600' };
    if (daysUntilExpiry <= 30) return { status: 'expiring soon', color: 'text-orange-600' };
    return { status: 'active', color: 'text-green-600' };
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'project_manager': return 'Project Manager';
      case 'field_worker': return 'Field Worker';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'field_worker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'profile'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          My Profile
        </button>
        
        {profile?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'admin'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Admin Panel
          </button>
        )}
        
        {/* Add Debug tab for developers */}
        <button
          onClick={() => setActiveTab('debug')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'debug'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Database className="w-4 h-4 inline mr-1" />
          Database
        </button>
      </div>

      {activeTab === 'admin' ? (
        <AdminPanel />
      ) : activeTab === 'debug' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">Database Diagnostics</h2>
          <p className="text-gray-300 mb-6">
            This panel shows the current state of the database connection and schema.
            It can help diagnose issues with data persistence and authentication.
          </p>
          <ProfileDatabaseInfo />
          
          {/* User Session Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">User Session</h3>
            <div className="overflow-x-auto">
              <pre className="text-xs text-gray-300 p-4 bg-slate-700/50 rounded-lg whitespace-pre-wrap">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </motion.div>
          
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Profile Data</h3>
            <div className="overflow-x-auto">
              <pre className="text-xs text-gray-300 p-4 bg-slate-700/50 rounded-lg whitespace-pre-wrap">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </motion.div>
          
          {/* Environment Variables (Safe to Display) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Environment Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Supabase URL</h4>
                <div className="p-2 bg-slate-700/50 rounded text-xs text-gray-300 break-all">
                  {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Supabase Anon Key</h4>
                <div className="p-2 bg-slate-700/50 rounded text-xs text-gray-300">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
                    '••••••••' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-8) : 
                    'Not configured'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-gray-400">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile?.role || '')}`}>
                      {getRoleDisplayName(profile?.role || '')}
                    </span>
                    {profile?.employee_id && (
                      <span className="text-sm text-gray-400">ID: {profile.employee_id}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.first_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.last_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.phone || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.department || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Emergency Contact</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.emergency_contact_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.emergency_contact_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Emergency Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.emergency_contact_phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                      className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile?.emergency_contact_phone || 'Not set'}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowGeneralSettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    General Settings
                  </span>
                </button>
                <button
                  onClick={() => setShowSecuritySettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Settings
                  </span>
                </button>
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center text-white">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Certifications
              </h2>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                Add Certification
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => {
                const status = getCertificationStatus(cert);
                return (
                  <div key={cert.id} className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{cert.certification_name}</h3>
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{cert.issuing_authority}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {cert.expiry_date ? `Expires: ${cert.expiry_date}` : 'No expiry date'}
                    </div>
                  </div>
                );
              })}
              {certifications.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  No certifications on file
                </div>
              )}
            </div>
          </motion.div>

          {/* Drug Screens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Drug Screening History</h2>
            <div className="space-y-3">
              {drugScreens.slice(0, 5).map((screen) => (
                <div key={screen.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{screen.test_type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-400">{screen.test_date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    screen.result === 'passed' ? 'bg-green-100 text-green-800' :
                    screen.result === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {screen.result}
                  </span>
                </div>
              ))}
              {drugScreens.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No drug screening records on file
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <GeneralSettingsModal 
        isOpen={showGeneralSettings} 
        onClose={() => setShowGeneralSettings(false)} 
      />
      <SecuritySettingsModal 
        isOpen={showSecuritySettings} 
        onClose={() => setShowSecuritySettings(false)} 
      />
      <NotificationsModal 
        isOpen={showNotificationsModal} 
        onClose={() => setShowNotificationsModal(false)} 
      />
      <PrivacyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
    </div>
  );
};

export default Profile;