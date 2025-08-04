import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, HardHat, ClipboardCheck, Crown } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import ModernSkyscraper from '@/components/graphics/ModernSkyscraper';

const Login: React.FC = () => {
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'field_worker',
    firstName: '',
    lastName: '',
    phone: '',
    employeeId: '',
    department: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInData.email || !signInData.password) {
      return;
    }

    setLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      // Error handling is done in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['email', 'password', 'confirmPassword', 'role', 'firstName', 'lastName', 'phone', 'employeeId', 'department', 'emergencyContactName', 'emergencyContactPhone'];
    const missingFields = requiredFields.filter(field => !signUpData[field as keyof typeof signUpData]);
    
    if (missingFields.length > 0) {
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      return;
    }

    setLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.role, {
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        phone: signUpData.phone,
        employeeId: signUpData.employeeId,
        department: signUpData.department,
        emergencyContactName: signUpData.emergencyContactName,
        emergencyContactPhone: signUpData.emergencyContactPhone
      });
    } catch (error: any) {
      // Error handling is done in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google OAuth
    console.log('Google Sign In clicked');
  };

  const roleOptions = [
    { value: 'field_worker', label: 'Field Worker', icon: HardHat, description: 'Front-line safety operations' },
    { value: 'supervisor', label: 'Supervisor', icon: Users, description: 'Team and site oversight' },
    { value: 'project_manager', label: 'Project Manager', icon: ClipboardCheck, description: 'Project coordination and management' },
    { value: 'safety_manager', label: 'Safety Manager', icon: Shield, description: 'Safety program leadership' },
    { value: 'admin', label: 'Administrator', icon: Crown, description: 'Full system administration' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-slate-800/95 border-blue-500/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, rotateY: -15 }}
              animate={{ 
                scale: 1,
                rotateY: 0,
                y: [0, -3, 0],
                rotateZ: [0, 0.5, -0.5, 0],
              }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                duration: 0.8,
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotateZ: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <div className="w-20 h-24 relative">
                {/* Animated glow effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-blue-400/30 via-cyan-400/20 to-transparent rounded-lg blur-xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <ModernSkyscraper />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">Safety Companion</CardTitle>
            <CardDescription className="text-slate-400">
              Enterprise Safety Management Platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>
                </form>

                {/* OAuth Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
                >
                  <SiGoogle className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        type="text"
                        value={signUpData.employeeId}
                        onChange={(e) => setSignUpData({ ...signUpData, employeeId: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="EMP001"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={signUpData.department} onValueChange={(value) => setSignUpData({ ...signUpData, department: value })}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="Construction" className="text-white">Construction</SelectItem>
                        <SelectItem value="Safety" className="text-white">Safety</SelectItem>
                        <SelectItem value="Engineering" className="text-white">Engineering</SelectItem>
                        <SelectItem value="Project Management" className="text-white">Project Management</SelectItem>
                        <SelectItem value="Operations" className="text-white">Operations</SelectItem>
                        <SelectItem value="Administration" className="text-white">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={signUpData.role} onValueChange={(value) => setSignUpData({ ...signUpData, role: value })}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value} className="text-white">
                            <div className="font-medium">{role.label}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Emergency Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Emergency Contact</Label>
                      <Input
                        id="emergencyContactName"
                        type="text"
                        value={signUpData.emergencyContactName}
                        onChange={(e) => setSignUpData({ ...signUpData, emergencyContactName: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="Contact name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        value={signUpData.emergencyContactPhone}
                        onChange={(e) => setSignUpData({ ...signUpData, emergencyContactPhone: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </Button>
                </form>

                {/* OAuth Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
                >
                  <SiGoogle className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;