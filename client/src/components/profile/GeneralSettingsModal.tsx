import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Languages, Monitor, Sun, Moon, Save, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import { showToast } from '../common/ToastContainer';

interface GeneralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // General settings state
  const [settings, setSettings] = useState({
    language: 'en',
    theme: 'system' as 'light' | 'dark' | 'system',
    timeFormat: '24h' as '12h' | '24h',
    dateFormat: 'MM/DD/YYYY' as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
    distanceUnit: 'miles' as 'miles' | 'kilometers',
    temperatureUnit: 'fahrenheit' as 'celsius' | 'fahrenheit',
    startPage: 'home' as 'home' | 'safety' | 'profile'
  });
  
  const handleLanguageChange = (value: string) => {
    setSettings({
      ...settings,
      language: value
    });
  };
  
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setSettings({
      ...settings,
      theme: value
    });
  };
  
  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };
  
  const handleSave = () => {
    setError(null);
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      showToast('General settings saved successfully', 'success');
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="General Settings">
      <div className="space-y-6">
        {/* Language */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Language</h3>
          </div>
          
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        
        {/* Theme */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Theme</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-lg flex flex-col items-center ${
                settings.theme === 'light' 
                  ? 'bg-blue-500/30 border border-blue-500'
                  : 'bg-slate-700/50 border border-transparent hover:border-blue-500/20'
              }`}
            >
              <Sun className="w-6 h-6 text-gray-300 mb-2" />
              <span className="text-sm text-gray-300">Light</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-lg flex flex-col items-center ${
                settings.theme === 'dark' 
                  ? 'bg-blue-500/30 border border-blue-500'
                  : 'bg-slate-700/50 border border-transparent hover:border-blue-500/20'
              }`}
            >
              <Moon className="w-6 h-6 text-gray-300 mb-2" />
              <span className="text-sm text-gray-300">Dark</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-lg flex flex-col items-center ${
                settings.theme === 'system' 
                  ? 'bg-blue-500/30 border border-blue-500'
                  : 'bg-slate-700/50 border border-transparent hover:border-blue-500/20'
              }`}
            >
              <Monitor className="w-6 h-6 text-gray-300 mb-2" />
              <span className="text-sm text-gray-300">System</span>
            </button>
          </div>
        </div>
        
        {/* Date and Time Format */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Format</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (European)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Time Format
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) => handleSettingChange('timeFormat', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Units */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Units</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Distance
              </label>
              <select
                value={settings.distanceUnit}
                onChange={(e) => handleSettingChange('distanceUnit', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="miles">Miles</option>
                <option value="kilometers">Kilometers</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Temperature
              </label>
              <select
                value={settings.temperatureUnit}
                onChange={(e) => handleSettingChange('temperatureUnit', e.target.value as any)}
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="fahrenheit">Fahrenheit (°F)</option>
                <option value="celsius">Celsius (°C)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Start Page */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Start Page</h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Default page on startup
            </label>
            <select
              value={settings.startPage}
              onChange={(e) => handleSettingChange('startPage', e.target.value as any)}
              className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="home">Home</option>
              <option value="safety">Safety Reports</option>
              <option value="profile">Profile</option>
            </select>
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

export default GeneralSettingsModal;