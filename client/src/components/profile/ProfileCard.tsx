import React from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, MapPin, Shield, Clock } from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  employeeId?: string;
  department?: string;
  hireDate?: string;
  lastLogin?: string;
  isActive: boolean;
  profilePhotoUrl?: string;
}

interface ProfileCardProps {
  profile: UserProfile;
  isCurrentUser?: boolean;
  onEdit?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  isCurrentUser = false, 
  onEdit 
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30';
      case 'safety_manager': return 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-300 border-orange-500/30';
      case 'project_manager': return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30';
      case 'supervisor': return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30';
      case 'field_worker': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-blue-500/20 p-6 hover:border-blue-400/40 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Profile Photo */}
          <div className="relative">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
            )}
            
            {/* Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              profile.isActive ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>

          {/* Name and Role */}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {profile.firstName} {profile.lastName}
              {isCurrentUser && (
                <span className="ml-2 text-sm text-cyan-400">(You)</span>
              )}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getRoleColor(profile.role)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {formatRole(profile.role)}
              </span>
              {profile.employeeId && (
                <span className="text-sm text-gray-400 bg-slate-700/30 px-2 py-1 rounded-md">
                  ID: {profile.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        {profile.email && (
          <div className="flex items-center space-x-3 text-sm p-2 bg-slate-700/30 rounded-lg">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-300">{profile.email}</span>
          </div>
        )}
        
        {profile.phone && (
          <div className="flex items-center space-x-3 text-sm p-2 bg-slate-700/30 rounded-lg">
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">{profile.phone}</span>
          </div>
        )}
        
        {profile.department && (
          <div className="flex items-center space-x-3 text-sm p-2 bg-slate-700/30 rounded-lg">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300">{profile.department}</span>
          </div>
        )}
        
        {profile.hireDate && (
          <div className="flex items-center space-x-3 text-sm p-2 bg-slate-700/30 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">
              Hired: {formatDate(profile.hireDate)}
            </span>
          </div>
        )}
        
        {profile.lastLogin && (
          <div className="flex items-center space-x-3 text-sm p-2 bg-slate-700/30 rounded-lg">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">
              Last active: {formatDate(profile.lastLogin)}
            </span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-4 border-t border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            profile.isActive 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              profile.isActive ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span>{profile.isActive ? 'Active Employee' : 'Inactive'}</span>
          </div>
          
          {isCurrentUser && (
            <span className="text-cyan-400 font-medium text-sm bg-cyan-500/20 px-3 py-1 rounded-full">
              Your Profile
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;