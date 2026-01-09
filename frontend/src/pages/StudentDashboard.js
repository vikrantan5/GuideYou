import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { LayoutDashboard, ListTodo, Trophy, MessageSquare, Brain, LogOut, Flame, Award, Menu, X } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner';
import { MyTasksPage } from './student/MyTasksPage';
import { ProgressPage } from './student/ProgressPage';
import { AIHelperPage } from './student/AIHelperPage';
import { ChatPage } from './student/ChatPage';

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progressRes, tasksRes, todayRes] = await Promise.all([
        api.getMyProgress(),
        api.getTasks(),
        api.getTodayTasks()
      ]);
      setProgress(progressRes.data);
      setTasks(tasksRes.data);
      setTodayTasks(todayRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
    <Link 
      to={to} 
      onClick={() => {
        setIsMobileMenuOpen(false);
        onClick?.();
      }}
      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors relative text-base"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {badge > 0 && (
        <Badge variant="destructive" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs absolute -top-1 left-8">
          {badge}
        </Badge>
      )}
    </Link>
  );

  const completionRate = progress && progress.total_tasks > 0 
    ? Math.round((progress.completed_tasks / progress.total_tasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary">My Dashboard</h1>
            </div>
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
              <Button 
                onClick={() => { logout(); navigate('/login'); }} 
                variant="outline" 
                size="sm" 
                data-testid="logout-button"
                className="text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-2">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/dashboard/tasks" icon={ListTodo} label="My Tasks" />
          <NavItem to="/dashboard/progress" icon={Trophy} label="Progress" />
          <NavItem to="/dashboard/chat" icon={MessageSquare} label="Chat with Admin" badge={unreadMessages} />
          <NavItem to="/dashboard/ai-helper" icon={Brain} label="AI Helper" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-2">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/dashboard/tasks" icon={ListTodo} label="My Tasks" />
            <NavItem to="/dashboard/progress" icon={Trophy} label="Progress" />
            <NavItem to="/dashboard/chat" icon={MessageSquare} label="Chat with Admin" badge={unreadMessages} />
            <NavItem to="/dashboard/ai-helper" icon={Brain} label="AI Helper" />
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <Routes>
              <Route path="/" element={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white" data-testid="streak-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                          <Flame className="w-5 h-5" />
                          Current Streak
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl sm:text-5xl font-bold">{progress?.current_streak || 0}</p>
                        <p className="text-xs sm:text-sm opacity-90 mt-2">days in a row!</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" data-testid="completion-card">
                      <CardHeader>
                        <CardTitle className="text-white text-base sm:text-lg">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl sm:text-5xl font-bold">{completionRate}%</p>
                        <Progress value={completionRate} className="mt-2 bg-white/30" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-400 to-teal-500 text-white sm:col-span-2 lg:col-span-1" data-testid="badges-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                          <Award className="w-5 h-5" />
                          Badges Earned
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl sm:text-5xl font-bold">{progress?.badges?.length || 0}</p>
                        <p className="text-xs sm:text-sm opacity-90 mt-2">achievements unlocked</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card data-testid="today-tasks-card">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Today's Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {todayTasks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">No tasks due today. Great job staying on top of things!</p>
                      ) : (
                        <div className="space-y-3">
                          {todayTasks.map(task => (
                            <div key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">{task.title}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{task.description}</p>
                              </div>
                              <Badge variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'destructive'} className="w-fit">
                                {task.difficulty}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {progress?.badges && progress.badges.length > 0 && (
                    <Card data-testid="badges-display-card">
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">My Badges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {progress.badges.map((badge, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm sm:text-lg py-2 px-3 sm:px-4">
                              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-500" />
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              } />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/ai-helper" element={<AIHelperPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};