import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Users, Shield, MapPin, Building2, Award, Clock, Eye, X } from 'lucide-react';
import ProfileCard from '@/components/profile/ProfileCard';
import LoadingState, { ProfileCardSkeleton } from '@/components/profile/LoadingState';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useToast } from '../hooks/use-toast';

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

const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentUser] = useState<UserProfile | null>(null); // Would be set from auth context
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const { toast } = useToast();

  // Mock data for demonstration - in production this would come from Supabase
  const mockProfiles: UserProfile[] = [
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@safety-companion.com',
      phone: '+1 (555) 000-0001',
      role: 'field_worker',
      employeeId: 'EMP001',
      department: 'Construction',
      hireDate: '2024-01-15',
      lastLogin: '2025-08-02',
      isActive: true
    },
    {
      id: '22222222-3333-4444-5555-666666666666',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1 (555) 000-0002',
      role: 'safety_manager',
      employeeId: 'EMP002',
      department: 'Safety',
      hireDate: '2023-03-10',
      lastLogin: '2025-08-01',
      isActive: true
    },
    {
      id: '33333333-4444-5555-6666-777777777777',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      email: 'mike.rodriguez@company.com',
      phone: '+1 (555) 000-0003',
      role: 'project_manager',
      employeeId: 'EMP003',
      department: 'Project Management',
      hireDate: '2022-08-20',
      lastLogin: '2025-07-31',
      isActive: true
    },
    {
      id: '44444444-5555-6666-7777-888888888888',
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@company.com',
      phone: '+1 (555) 000-0004',
      role: 'supervisor',
      employeeId: 'EMP004',
      department: 'Construction',
      hireDate: '2023-11-05',
      lastLogin: '2025-08-02',
      isActive: true
    },
    {
      id: '55555555-6666-7777-8888-999999999999',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@company.com',
      phone: '+1 (555) 000-0005',
      role: 'field_worker',
      employeeId: 'EMP005',
      department: 'Electrical',
      hireDate: '2024-05-12',
      lastLogin: '2025-07-30',
      isActive: false
    }
  ];

  useEffect(() => {
    // Simulate loading from database
    const loadProfiles = async () => {
      setLoading(true);
      try {
        // In production, this would be a Supabase query with RLS
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setProfiles(mockProfiles);
        setFilteredProfiles(mockProfiles);
      } catch (error) {
        
        toast({
          title: 'Error',
          description: 'Failed to load user profiles',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [toast]);

  useEffect(() => {
    // Filter profiles based on search and filters
    let filtered = profiles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(profile =>
        `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(profile => profile.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(profile => profile.department === departmentFilter);
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, roleFilter, departmentFilter]);

  const uniqueRoles = Array.from(new Set(profiles.map(p => p.role)));
  const uniqueDepartments = Array.from(new Set(profiles.map(p => p.department).filter(Boolean)));

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.isActive).length,
    admins: profiles.filter(p => p.role === 'admin').length,
    managers: profiles.filter(p => ['safety_manager', 'project_manager'].includes(p.role)).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProfileCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-400" />
                Enterprise Team Management
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
                Secure workforce management for 175+ construction professionals
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  <span>Safety Companion Demo Company</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Enterprise Security</span>
                </div>
              </div>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">Total Workforce</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-green-400 mt-1">↗ Enterprise Scale</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">Active Workers</p>
                  <p className="text-3xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-green-400 mt-1">↗ {Math.round((stats.active/stats.total)*100)}% Active</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">Safety Officers</p>
                  <p className="text-3xl font-bold text-white">{stats.admins}</p>
                  <p className="text-xs text-orange-400 mt-1">Security Level</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">Management</p>
                  <p className="text-3xl font-bold text-white">{stats.managers}</p>
                  <p className="text-xs text-purple-400 mt-1">Leadership Team</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept, index) => (
                  <option key={dept || `dept-${index}`} value={dept || ''}>{dept}</option>
                ))}
              </select>
            </div>
            
            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/30 transition-colors">
                Active Only
              </button>
              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30 transition-colors">
                Recent Hires
              </button>
              <button className="px-3 py-1 text-xs bg-orange-500/20 text-orange-300 rounded-full hover:bg-orange-500/30 transition-colors">
                Certifications Expiring
              </button>
            </div>
          </div>
        </motion.div>

        {/* Profiles Grid */}
        {filteredProfiles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 6) }}
              >
                <ProfileCard
                  profile={profile}
                  isCurrentUser={currentUser?.id === profile.id}
                  onEdit={() => {
                    setSelectedProfile(profile);
                    setViewMode('detail');
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 max-w-md mx-auto">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No profiles found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </motion.div>
        )}

        {/* Profile Detail Modal */}
        {selectedProfile && viewMode === 'detail' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedProfile(null);
              setViewMode('grid');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 border-b border-blue-500/20 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                    {selectedProfile.firstName.charAt(0)}{selectedProfile.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedProfile.firstName} {selectedProfile.lastName}
                    </h2>
                    <p className="text-gray-400">{selectedProfile.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProfile(null);
                    setViewMode('grid');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <ProfileTabs
                  profile={selectedProfile}
                  isCurrentUser={currentUser?.id === selectedProfile.id}
                  onSave={(data) => {
                    // Handle profile save
                    toast({
                      title: 'Profile Updated',
                      description: 'Profile changes have been saved successfully.',
                    });
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profiles;