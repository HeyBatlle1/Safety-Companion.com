import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Key, AlertTriangle, Shield, Eye, EyeOff, Save } from 'lucide-react';
import Modal from '../common/Modal';
import { showToast } from '../common/ToastContainer';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Two-factor authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Device management state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  
  const handleSavePassword = () => {
    setError(null);
    
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully', 'success');
    }, 1000);
  };
  
  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    showToast(
      twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled',
      twoFactorEnabled ? 'warning' : 'success'
    );
  };
  
  const handleSessionTimeoutChange = (value: number) => {
    setSessionTimeout(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Settings">
      <div className="space-y-6">
        {/* Password section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-medium text-white">Password</h3>
            </div>
            
            {!isChangingPassword && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsChangingPassword(true)}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
              >
                Change Password
              </motion.button>
            )}
          </div>
          
          {isChangingPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {error && (
                <div className="p-2 bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setError(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassword}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  <span>Save Password</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Two-factor authentication */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={twoFactorEnabled}
                onChange={handleToggleTwoFactor}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <p className="text-sm text-gray-400">
            {twoFactorEnabled
              ? 'Two-factor authentication is enabled. You will receive a verification code when signing in from a new device.'
              : 'Enable two-factor authentication to add an extra layer of security to your account.'}
          </p>
        </div>
        
        {/* Session management */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Session Management</h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Session Timeout (minutes)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={sessionTimeout}
                onChange={(e) => handleSessionTimeoutChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white w-10 text-center">{sessionTimeout}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Your session will automatically expire after {sessionTimeout} minutes of inactivity.
            </p>
          </div>
        </div>
        
        {/* Active sessions section would go here in a real implementation */}
        
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default SecuritySettingsModal;