import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle, Clock, XCircle, Upload, Send } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    content: '',
    file_url: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = (task) => {
    setSelectedTask(task);
    setSubmissionData({ content: '', file_url: '' });
    setIsDialogOpen(true);
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.createSubmission({
        task_id: selectedTask.id,
        content: submissionData.content,
        file_url: submissionData.file_url
      });
      toast.success('Task submitted successfully!');
      setIsDialogOpen(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to submit task:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit task');
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'success',
      Medium: 'warning',
      Hard: 'destructive'
    };
    return colors[difficulty] || 'default';
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const pendingTasks = tasks.filter(t => !t.submission || t.submission?.status === 'pending');
  const completedTasks = tasks.filter(t => t.submission?.status === 'approved');

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold" data-testid="my-tasks-page-title">My Tasks</h2>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" data-testid="pending-tasks-tab">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="completed-tasks-tab">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">No pending tasks. You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <Card key={task.id} className={isOverdue(task.deadline) ? 'border-red-500' : ''} data-testid={`task-card-${task.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription className="mt-2">{task.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getDifficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                      {isOverdue(task.deadline) && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <strong>Type:</strong> {task.submission_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Deadline:</strong> {new Date(task.deadline).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={() => handleSubmitTask(task)} data-testid={`submit-task-button-${task.id}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">No completed tasks yet. Start submitting!</p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <Card key={task.id} className="border-green-500" data-testid={`completed-task-card-${task.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{task.description}</CardDescription>
                    </div>
                    <Badge variant="success">Approved</Badge>
                  </div>
                </CardHeader>
                {task.submission?.feedback && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded">
                      <p className="text-sm font-semibold mb-2">Feedback:</p>
                      <p className="text-sm text-muted-foreground">{task.submission.feedback}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="submit-task-dialog">
          <DialogHeader>
            <DialogTitle>Submit: {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmission} className="space-y-4">
            <div>
              <Label htmlFor="content">Your Answer / Description</Label>
              <Textarea
                id="content"
                placeholder="Write your answer or describe your submission..."
                value={submissionData.content}
                onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                rows={6}
                required
                data-testid="submission-content-input"
              />
            </div>
            {selectedTask?.submission_type !== 'text' && (
              <div>
                <Label htmlFor="file_url">File URL (Image/Video/Link)</Label>
                <Input
                  id="file_url"
                  type="url"
                  placeholder="https://..."
                  value={submissionData.file_url}
                  onChange={(e) => setSubmissionData({ ...submissionData, file_url: e.target.value })}
                  data-testid="submission-file-url-input"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-task-final-button">
                <Upload className="w-4 h-4 mr-2" />
                Submit Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};