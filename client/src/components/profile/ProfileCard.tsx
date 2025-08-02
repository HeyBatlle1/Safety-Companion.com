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
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'safety_manager': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'project_manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'supervisor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'field_worker': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {profile.firstName} {profile.lastName}
              {isCurrentUser && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">(You)</span>
              )}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {formatRole(profile.role)}
              </span>
              {profile.employeeId && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
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
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{profile.email}</span>
          </div>
        )}
        
        {profile.phone && (
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{profile.phone}</span>
          </div>
        )}
        
        {profile.department && (
          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{profile.department}</span>
          </div>
        )}
        
        {profile.hireDate && (
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              Hired: {formatDate(profile.hireDate)}
            </span>
          </div>
        )}
        
        {profile.lastLogin && (
          <div className="flex items-center space-x-3 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              Last active: {formatDate(profile.lastLogin)}
            </span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${
            profile.isActive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {profile.isActive ? 'Active Employee' : 'Inactive'}
          </span>
          
          {isCurrentUser && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Your Profile
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;