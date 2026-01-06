import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { LayoutDashboard, ListTodo, Trophy, MessageSquare, Brain, LogOut, Flame, Award } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner';
import { MyTasksPage } from './student/MyTasksPage';
import { ProgressPage } from './student/ProgressPage';
import { AIHelperPage } from './student/AIHelperPage';

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);

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

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );

  const completionRate = progress && progress.total_tasks > 0 
    ? Math.round((progress.completed_tasks / progress.total_tasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-heading font-bold text-primary">My Dashboard</h1>
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
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/dashboard/tasks" icon={ListTodo} label="My Tasks" />
            <NavItem to="/dashboard/progress" icon={Trophy} label="Progress" />
            <NavItem to="/dashboard/ai-helper" icon={Brain} label="AI Helper" />
          </aside>

          <main className="lg:col-span-3">
            <Routes>
              <Route path="/" element={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white" data-testid="streak-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Flame className="w-5 h-5" />
                          Current Streak
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-5xl font-bold">{progress?.current_streak || 0}</p>
                        <p className="text-sm opacity-90 mt-2">days in a row!</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" data-testid="completion-card">
                      <CardHeader>
                        <CardTitle className="text-white">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-5xl font-bold">{completionRate}%</p>
                        <Progress value={completionRate} className="mt-2 bg-white/30" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-400 to-teal-500 text-white" data-testid="badges-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Badges Earned
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-5xl font-bold">{progress?.badges?.length || 0}</p>
                        <p className="text-sm opacity-90 mt-2">achievements unlocked</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card data-testid="today-tasks-card">
                    <CardHeader>
                      <CardTitle>Today's Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {todayTasks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No tasks due today. Great job staying on top of things!</p>
                      ) : (
                        <div className="space-y-3">
                          {todayTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                              <Badge variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'destructive'}>
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
                        <CardTitle>My Badges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          {progress.badges.map((badge, idx) => (
                            <Badge key={idx} variant="outline" className="text-lg py-2 px-4">
                              <Award className="w-4 h-4 mr-2 text-yellow-500" />
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
              <Route path="/ai-helper" element={<AIHelperPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};
