import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold" data-testid="leaderboard-page-title">Student Leaderboard</h2>
        <Badge variant="outline" className="text-base sm:text-lg px-3 sm:px-4 py-2 w-fit">
          <TrendingUp className="w-4 h-4 mr-2" />
          {leaderboard.length} Students
        </Badge>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground text-sm sm:text-base">No student data available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((student, index) => (
              <Card key={student.student_id} className={`${index === 0 ? 'border-yellow-500 border-2' : ''}`} data-testid={`top-student-card-${index}`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index)}
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{student.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{student.completion_rate.toFixed(1)}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="flex justify-center gap-4 text-sm">
                    <div>
                      <p className="font-bold">{student.current_streak}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                    <div>
                      <p className="font-bold">{student.badges.length}</p>
                      <p className="text-xs text-muted-foreground">Badges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="full-leaderboard-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Full Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Badges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((student, index) => (
                      <TableRow key={student.student_id} data-testid={`leaderboard-row-${index}`}>
                        <TableCell className="font-medium">
                          {getRankIcon(index)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.completed_tasks}/{student.total_tasks}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.completion_rate.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-orange-500">{student.current_streak} days</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span>{student.badges.length}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {leaderboard.map((student, index) => (
                  <Card key={student.student_id} data-testid={`leaderboard-card-${index}`} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getRankIcon(index)}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{student.name}</h3>
                            <p className="text-xs text-muted-foreground">{student.completed_tasks}/{student.total_tasks} tasks</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
                        <div>
                          <p className="text-lg font-bold text-primary">{student.completion_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-500">{student.current_streak}</p>
                          <p className="text-xs text-muted-foreground">Streak</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-500">{student.badges.length}</p>
                          <p className="text-xs text-muted-foreground">Badges</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};