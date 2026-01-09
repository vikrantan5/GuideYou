import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Flame, Trophy, Award, Target, Calendar, TrendingUp } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const ProgressPage = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getMyProgress();
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!progress) {
    return <div className="text-center py-12">No progress data available</div>;
  }

  const completionRate = progress.total_tasks > 0 
    ? Math.round((progress.completed_tasks / progress.total_tasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold" data-testid="progress-page-title">My Progress</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white" data-testid="current-streak-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl sm:text-5xl font-bold">{progress.current_streak}</p>
            <p className="text-xs sm:text-sm opacity-90 mt-2">days in a row!</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" data-testid="longest-streak-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl sm:text-5xl font-bold">{progress.longest_streak}</p>
            <p className="text-xs sm:text-sm opacity-90 mt-2">personal best</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400 to-teal-500 text-white" data-testid="completion-rate-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl sm:text-5xl font-bold">{completionRate}%</p>
            <p className="text-xs sm:text-sm opacity-90 mt-2">{progress.completed_tasks}/{progress.total_tasks} tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white" data-testid="badges-count-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl sm:text-5xl font-bold">{progress.badges?.length || 0}</p>
            <p className="text-xs sm:text-sm opacity-90 mt-2">achievements</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="completion-progress-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Task Completion Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">Overall Progress</span>
                <span className="text-xs sm:text-sm font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3 sm:h-4" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{progress.completed_tasks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{progress.total_tasks - progress.completed_tasks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{progress.total_tasks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {progress.badges && progress.badges.length > 0 && (
        <Card data-testid="badges-showcase-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              My Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {progress.badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow" data-testid={`badge-${idx}`}>
                  <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mb-2" />
                  <Badge variant="outline" className="text-center text-xs sm:text-sm">{badge}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="streak-calendar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Keep your streak going! Active for {progress.streak_dates?.length || 0} days.
            </p>
            {progress.streak_dates && progress.streak_dates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {progress.streak_dates.slice(-14).map((date, idx) => (
                  <div key={idx} className="px-2 sm:px-3 py-1 sm:py-2 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};