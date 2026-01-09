import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

export const LoginPage = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(regEmail, regName, regPassword, 'student');
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary p-3 sm:p-4">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">EduTrack</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Student Task Management Platform</p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-heading">Welcome</CardTitle>
            <CardDescription className="text-sm sm:text-base">Login or create your student account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab" className="text-sm sm:text-base">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab" className="text-sm sm:text-base">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="login-email"
                      data-testid="login-email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm sm:text-base">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    data-testid="login-submit-button"
                    className="w-full rounded-full text-sm sm:text-base" 
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-sm sm:text-base">Name</Label>
                    <Input
                      id="reg-name"
                      data-testid="register-name-input"
                      type="text"
                      placeholder="Your Name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="reg-email"
                      data-testid="register-email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-sm sm:text-base">Password</Label>
                    <Input
                      id="reg-password"
                      data-testid="register-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    data-testid="register-submit-button"
                    className="w-full rounded-full text-sm sm:text-base" 
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};