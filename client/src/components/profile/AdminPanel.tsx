import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Building, 
  AlertTriangle, 
  Search,
  UserPlus,
  Settings,
  Calendar,
  Award
} from 'lucide-react';
import { UserProfile, CertificationExpiryAlert } from '../../types/profile';
import { 
  getTeamMembers, 
  assignUserRole, 
  hasPermission 
} from '../../services/profileService';
import { showToast } from '../common/ToastContainer';
import EnhancedAdminDashboard from '../admin/EnhancedAdminDashboard';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<CertificationExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user has admin permissions
      const hasAdminPermission = await hasPermission('profiles');
      setIsAdmin(hasAdminPermission);
      
      if (hasAdminPermission) {
        const teamData = await getTeamMembers();
        
        setUsers(teamData);
        
        // Use mock data for expiry alerts since we're only checking every 14 days
        setExpiryAlerts(getMockExpiryAlerts());
      }
    } catch (error) {
      
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock certification expiry alerts as fallback
  const getMockExpiryAlerts = (): CertificationExpiryAlert[] => {
    const today = new Date();
    
    return [
      {
        id: 'alert-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Smith',
        employee_id: 'EMP001',
        certification_name: 'First Aid/CPR',
        expiry_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days_until_expiry: 15,
        certification_alert_days: 30
      },
      {
        id: 'alert-2',
        user_id: 'user-2',
        first_name: 'Jane',
        last_name: 'Doe',
        employee_id: 'EMP002',
        certification_name: 'OSHA 10-Hour',
        expiry_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days_until_expiry: 5,
        certification_alert_days: 30
      },
      {
        id: 'alert-3',
        user_id: 'user-3',
        first_name: 'Mike',
        last_name: 'Johnson',
        employee_id: 'EMP003',
        certification_name: 'Forklift Operation',
        expiry_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days_until_expiry: -2,
        certification_alert_days: 30
      }
    ];
  };

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    try {
      await assignUserRole(userId, newRole);
      showToast('User role updated successfully', 'success');
      loadData(); // Refresh data
    } catch (error) {
      
      showToast('Failed to update user role', 'error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'field_worker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'text-red-600';
    if (daysUntilExpiry <= 7) return 'text-orange-600';
    if (daysUntilExpiry <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [viewMode, setViewMode] = useState<'dashboard' | 'users'>('dashboard');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-1 flex">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'dashboard'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'users'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            User Management
          </button>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <EnhancedAdminDashboard />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-gray-400">Manage users, roles, and permissions</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Project Managers</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === 'project_manager').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Expiring Certs</p>
              <p className="text-2xl font-bold text-white">{expiryAlerts.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Certification Expiry Alerts */}
      {expiryAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Certification Expiry Alerts</h2>
          </div>
          <div className="space-y-2">
            {expiryAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">
                    {alert.first_name} {alert.last_name} - {alert.certification_name}
                  </p>
                  <p className="text-sm text-gray-400">Employee ID: {alert.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getExpiryColor(alert.days_until_expiry)}`}>
                    {alert.days_until_expiry < 0 
                      ? `Expired ${Math.abs(alert.days_until_expiry)} days ago`
                      : `Expires in ${alert.days_until_expiry} days`
                    }
                  </p>
                  <p className="text-sm text-gray-400">{alert.expiry_date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">User Management</h2>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500/40"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="project_manager">Project Manager</option>
              <option value="field_worker">Field Worker</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-gray-300">User</th>
                <th className="text-left py-3 px-4 text-gray-300">Employee ID</th>
                <th className="text-left py-3 px-4 text-gray-300">Role</th>
                <th className="text-left py-3 px-4 text-gray-300">Department</th>
                <th className="text-left py-3 px-4 text-gray-300">Status</th>
                <th className="text-left py-3 px-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-400">{user.phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{user.employee_id || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserProfile['role'])}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)} border-0 focus:outline-none`}
                    >
                      <option value="field_worker">Field Worker</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{user.department || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm">
                        Edit
                      </button>
                      <button className="text-gray-400 hover:text-gray-300 text-sm">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;