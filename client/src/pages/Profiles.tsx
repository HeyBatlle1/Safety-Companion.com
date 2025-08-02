import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Users, Shield, MapPin } from 'lucide-react';
import ProfileCard from '@/components/profile/ProfileCard';
import LoadingState, { ProfileCardSkeleton } from '@/components/profile/LoadingState';
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
        console.error('Error loading profiles:', error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Team Profiles
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your company's 175-person workforce with enterprise-grade security
              </p>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admins}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Managers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.managers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept, index) => (
                  <option key={dept || `dept-${index}`} value={dept || ''}>{dept}</option>
                ))}
              </select>
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
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isCurrentUser={currentUser?.id === profile.id}
                onEdit={() => toast({
                  title: 'Edit Profile',
                  description: `Opening edit form for ${profile.firstName} ${profile.lastName}`,
                })}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No profiles found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profiles;