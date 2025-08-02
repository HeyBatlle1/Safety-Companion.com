import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Phone, Smartphone, Computer, Save } from 'lucide-react';
import Modal from '../common/Modal';
import { showToast } from '../common/ToastContainer';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState({
    safetyAlerts: true,
    certificationReminders: true,
    weeklyDigest: false,
    newTraining: true,
    accountUpdates: true
  });
  
  const [pushNotifications, setPushNotifications] = useState({
    safetyAlerts: true,
    certificationReminders: true,
    weeklyDigest: false,
    newTraining: false,
    accountUpdates: false
  });
  
  const [smsNotifications, setSmsNotifications] = useState({
    safetyAlerts: true,
    certificationReminders: false,
    weeklyDigest: false,
    newTraining: false,
    accountUpdates: false
  });
  
  const handleToggleEmailNotification = (key: keyof typeof emailNotifications) => {
    setEmailNotifications({
      ...emailNotifications,
      [key]: !emailNotifications[key]
    });
  };
  
  const handleTogglePushNotification = (key: keyof typeof pushNotifications) => {
    setPushNotifications({
      ...pushNotifications,
      [key]: !pushNotifications[key]
    });
  };
  
  const handleToggleSmsNotification = (key: keyof typeof smsNotifications) => {
    setSmsNotifications({
      ...smsNotifications,
      [key]: !smsNotifications[key]
    });
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      showToast('Notification settings saved successfully', 'success');
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Settings">
      <div className="space-y-6">
        {/* Email notifications */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Email Notifications</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(emailNotifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-300 cursor-pointer">
                  {key === 'safetyAlerts' && 'Safety Alerts'}
                  {key === 'certificationReminders' && 'Certification Reminders'}
                  {key === 'weeklyDigest' && 'Weekly Digest'}
                  {key === 'newTraining' && 'New Training Available'}
                  {key === 'accountUpdates' && 'Account Updates'}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={value}
                    onChange={() => handleToggleEmailNotification(key as keyof typeof emailNotifications)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Push notifications */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Push Notifications</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(pushNotifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-300 cursor-pointer">
                  {key === 'safetyAlerts' && 'Safety Alerts'}
                  {key === 'certificationReminders' && 'Certification Reminders'}
                  {key === 'weeklyDigest' && 'Weekly Digest'}
                  {key === 'newTraining' && 'New Training Available'}
                  {key === 'accountUpdates' && 'Account Updates'}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={value}
                    onChange={() => handleTogglePushNotification(key as keyof typeof pushNotifications)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* SMS notifications */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">SMS Notifications</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(smsNotifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-300 cursor-pointer">
                  {key === 'safetyAlerts' && 'Safety Alerts'}
                  {key === 'certificationReminders' && 'Certification Reminders'}
                  {key === 'weeklyDigest' && 'Weekly Digest'}
                  {key === 'newTraining' && 'New Training Available'}
                  {key === 'accountUpdates' && 'Account Updates'}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={value}
                    onChange={() => handleToggleSmsNotification(key as keyof typeof smsNotifications)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Device settings */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Computer className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Device Settings</h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Quiet Hours
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input
                  type="time"
                  value="22:00"
                  className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input
                  type="time"
                  value="06:00"
                  className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              No notifications will be sent during quiet hours except for critical safety alerts.
            </p>
          </div>
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

export default NotificationsModal;