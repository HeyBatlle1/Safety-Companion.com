import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Award, Shield, Settings, Upload, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ProfileTabsProps {
  profile: any;
  isCurrentUser: boolean;
  onSave: (data: any) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ profile, isCurrentUser, onSave }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'safety', label: 'Safety Records', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const mockCertifications = [
    {
      id: 1,
      name: 'OSHA 30-Hour Construction',
      authority: 'OSHA',
      issueDate: '2024-01-15',
      expiryDate: '2027-01-15',
      status: 'active',
      documentUrl: '#'
    },
    {
      id: 2,
      name: 'First Aid/CPR',
      authority: 'American Red Cross',
      issueDate: '2023-06-10',
      expiryDate: '2025-06-10',
      status: 'expiring_soon',
      documentUrl: '#'
    },
    {
      id: 3,
      name: 'Confined Space Entry',
      authority: 'National Safety Council',
      issueDate: '2023-03-20',
      expiryDate: '2024-03-20',
      status: 'expired',
      documentUrl: '#'
    }
  ];

  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-300 bg-green-500/20';
      case 'expiring_soon': return 'text-yellow-300 bg-yellow-500/20';
      case 'expired': return 'text-red-300 bg-red-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getCertificationIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'expiring_soon': return Clock;
      case 'expired': return AlertTriangle;
      default: return Award;
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-blue-500/20 shadow-lg overflow-hidden">
      {/* Tab Headers */}
      <div className="border-b border-blue-500/20 bg-slate-800/80">
        <div className="flex space-x-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-t-lg"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'personal' && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                {isCurrentUser && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/30 rounded-lg text-gray-300">
                      {profile.firstName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/30 rounded-lg text-gray-300">
                      {profile.lastName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="px-4 py-3 bg-slate-700/30 rounded-lg text-gray-300">
                    {profile.email}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/30 rounded-lg text-gray-300">
                      {profile.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Emergency Contact</label>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                      />
                      <input
                        type="tel"
                        placeholder="Contact Phone"
                        className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                      />
                      <input
                        type="text"
                        placeholder="Relationship"
                        className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
                      />
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-slate-700/30 rounded-lg text-gray-300">
                      Emergency contact information not provided
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'certifications' && (
            <motion.div
              key="certifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Safety Certifications</h3>
                {isCurrentUser && (
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload New</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {mockCertifications.map((cert) => {
                  const StatusIcon = getCertificationIcon(cert.status);
                  return (
                    <div
                      key={cert.id}
                      className="p-4 bg-slate-700/30 rounded-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-white">{cert.name}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCertificationStatusColor(cert.status)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cert.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">Issued by: {cert.authority}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          View Document
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white">Safety Records</h3>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">Safety Record Clean</h4>
                <p className="text-gray-400">No safety incidents or violations on record</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white">Preferences</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Email notifications</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">SMS alerts for emergencies</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Certification expiry reminders</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileTabs;