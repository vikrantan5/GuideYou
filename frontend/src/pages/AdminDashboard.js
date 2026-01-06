import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LayoutDashboard, Users, ListTodo, CheckSquare, MessageSquare, TrendingUp, Megaphone, LogOut } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, tasks: 0, submissions: 0 });

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

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-heading font-bold text-primary">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button onClick={() => { logout(); navigate('/login'); }} variant="outline" size="sm" data-testid="logout-button">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-2">
            <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/admin/students" icon={Users} label="Students" />
            <NavItem to="/admin/tasks" icon={ListTodo} label="Tasks" />
            <NavItem to="/admin/submissions" icon={CheckSquare} label="Submissions" />
            <NavItem to="/admin/leaderboard" icon={TrendingUp} label="Leaderboard" />
            <NavItem to="/admin/announcements" icon={Megaphone} label="Announcements" />
          </aside>

          <main className="lg:col-span-3">
            <Routes>
              <Route path="/" element={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card data-testid="students-stat-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Total Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-primary">{stats.students}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="tasks-stat-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Active Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-secondary">{stats.tasks}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="submissions-stat-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Pending Reviews</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-accent">{stats.submissions}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                      <Button onClick={() => navigate('/admin/tasks')} data-testid="create-task-button">Create Task</Button>
                      <Button onClick={() => navigate('/admin/students')} variant="outline" data-testid="add-student-button">Add Student</Button>
                      <Button onClick={() => navigate('/admin/announcements')} variant="outline" data-testid="new-announcement-button">New Announcement</Button>
                    </CardContent>
                  </Card>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};
