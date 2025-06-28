import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Globe, Building, Eye, Save } from 'lucide-react';
import Modal from '../common/Modal';
import { showToast } from '../common/ToastContainer';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    shareProfileWithCompany: true,
    shareProfileWithPartners: false,
    shareCompletedTrainings: true,
    shareCertifications: true,
    allowDataAnalytics: true
  });
  
  // Data visibility settings
  const [visibilitySettings, setVisibilitySettings] = useState({
    profileVisibility: 'company' as 'public' | 'company' | 'private',
    certificationsVisibility: 'company' as 'public' | 'company' | 'private',
    trainingVisibility: 'company' as 'public' | 'company' | 'private',
  });
  
  const handleTogglePrivacySetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: !privacySettings[key]
    });
  };
  
  const handleVisibilityChange = (key: keyof typeof visibilitySettings, value: 'public' | 'company' | 'private') => {
    setVisibilitySettings({
      ...visibilitySettings,
      [key]: value
    });
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      showToast('Privacy settings saved successfully', 'success');
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Settings">
      <div className="space-y-6">
        {/* Profile visibility */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Profile Visibility</h3>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Who can see your profile?
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={visibilitySettings.profileVisibility === 'public'}
                    onChange={() => handleVisibilityChange('profileVisibility', 'public')}
                    className="text-blue-500 focus:ring-blue-500 h-4 w-4 bg-slate-700 border-slate-600"
                  />
                  <div>
                    <span className="text-gray-300">Public</span>
                    <p className="text-xs text-gray-400">Anyone can view your profile</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={visibilitySettings.profileVisibility === 'company'}
                    onChange={() => handleVisibilityChange('profileVisibility', 'company')}
                    className="text-blue-500 focus:ring-blue-500 h-4 w-4 bg-slate-700 border-slate-600"
                  />
                  <div>
                    <span className="text-gray-300">Company Only</span>
                    <p className="text-xs text-gray-400">Only people in your company can view your profile</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={visibilitySettings.profileVisibility === 'private'}
                    onChange={() => handleVisibilityChange('profileVisibility', 'private')}
                    className="text-blue-500 focus:ring-blue-500 h-4 w-4 bg-slate-700 border-slate-600"
                  />
                  <div>
                    <span className="text-gray-300">Private</span>
                    <p className="text-xs text-gray-400">Only you can view your profile</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data sharing */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Data Sharing</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(privacySettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-300 cursor-pointer">
                  {key === 'shareProfileWithCompany' && 'Share Profile with Company'}
                  {key === 'shareProfileWithPartners' && 'Share Profile with Partners'}
                  {key === 'shareCompletedTrainings' && 'Share Completed Trainings'}
                  {key === 'shareCertifications' && 'Share Certifications'}
                  {key === 'allowDataAnalytics' && 'Allow Data Analytics'}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={value}
                    onChange={() => handleTogglePrivacySetting(key as keyof typeof privacySettings)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Content visibility */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Content Visibility</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Certifications Visibility
              </label>
              <select
                value={visibilitySettings.certificationsVisibility}
                onChange={(e) => handleVisibilityChange('certificationsVisibility', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="company">Company Only - Only your company can see</option>
                <option value="private">Private - Only you can see</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Training History Visibility
              </label>
              <select
                value={visibilitySettings.trainingVisibility}
                onChange={(e) => handleVisibilityChange('trainingVisibility', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="company">Company Only - Only your company can see</option>
                <option value="private">Private - Only you can see</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Data retention notice */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
          <p className="text-sm text-gray-300">
            We retain your data in accordance with our <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>. You can request a copy of your data or deletion at any time.
          </p>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            <span>Save Settings</span>
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyModal;