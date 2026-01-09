import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LayoutDashboard, Users, ListTodo, CheckSquare, MessageSquare, TrendingUp, Megaphone, LogOut, Menu, X } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner';
import { StudentsPage } from './admin/StudentsPage';
import { TasksPage } from './admin/TasksPage';
import { SubmissionsPage } from './admin/SubmissionsPage';
import { LeaderboardPage } from './admin/LeaderboardPage';
import { AnnouncementsPage } from './admin/AnnouncementsPage';
import { AdminChatsPage } from './admin/AdminChatsPage';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, tasks: 0, submissions: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, tasksRes, submissionsRes] = await Promise.all([
        api.getStudents(),
        api.getTasks(),
        api.getSubmissions()
      ]);
      setStats({
        students: studentsRes.data.length,
        tasks: tasksRes.data.length,
        submissions: submissionsRes.data.filter(s => s.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const NavItem = ({ to, icon: Icon, label, onClick }) => (
    <Link 
      to={to} 
      onClick={() => {
        setIsMobileMenuOpen(false);
        onClick?.();
      }}
      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-base"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
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
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-primary">Admin Dashboard</h1>
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
          <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/admin/students" icon={Users} label="Students" />
          <NavItem to="/admin/tasks" icon={ListTodo} label="Tasks" />
          <NavItem to="/admin/submissions" icon={CheckSquare} label="Submissions" />
          <NavItem to="/admin/chats" icon={MessageSquare} label="Student Chats" />
          <NavItem to="/admin/leaderboard" icon={TrendingUp} label="Leaderboard" />
          <NavItem to="/admin/announcements" icon={Megaphone} label="Announcements" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-2">
            <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/admin/students" icon={Users} label="Students" />
            <NavItem to="/admin/tasks" icon={ListTodo} label="Tasks" />
            <NavItem to="/admin/submissions" icon={CheckSquare} label="Submissions" />
            <NavItem to="/admin/chats" icon={MessageSquare} label="Student Chats" />
            <NavItem to="/admin/leaderboard" icon={TrendingUp} label="Leaderboard" />
            <NavItem to="/admin/announcements" icon={Megaphone} label="Announcements" />
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <Routes>
              <Route path="/" element={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card data-testid="students-stat-card">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Total Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl sm:text-4xl font-bold text-primary">{stats.students}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="tasks-stat-card">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Active Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl sm:text-4xl font-bold text-secondary">{stats.tasks}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="submissions-stat-card" className="sm:col-span-2 lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Pending Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl sm:text-4xl font-bold text-accent">{stats.submissions}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button onClick={() => navigate('/admin/tasks')} data-testid="create-task-button" className="w-full sm:w-auto">Create Task</Button>
                      <Button onClick={() => navigate('/admin/students')} variant="outline" data-testid="add-student-button" className="w-full sm:w-auto">Add Student</Button>
                      <Button onClick={() => navigate('/admin/announcements')} variant="outline" data-testid="new-announcement-button" className="w-full sm:w-auto">New Announcement</Button>
                    </CardContent>
                  </Card>
                </div>
              } />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/submissions" element={<SubmissionsPage />} />
              <Route path="/chats" element={<AdminChatsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};