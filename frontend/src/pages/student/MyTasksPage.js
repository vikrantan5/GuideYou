import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

// Utility function to safely extract error messages
const getErrorMessage = (error) => {
  try {
    if (!error) return 'An error occurred';
    
    // Check for response data
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle FastAPI validation errors (array)
      if (Array.isArray(data.detail)) {
        return data.detail
          .map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return String(err.msg);
            return 'Validation error';
          })
          .join('; ');
      }
      
      // Handle simple string error
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      // Handle message field
      if (typeof data.message === 'string') {
        return data.message;
      }
    }
    
    // Fallback to error message
    if (typeof error.message === 'string') {
      return error.message;
    }
    
    return 'An error occurred';
  } catch (e) {
    console.error('Error parsing error message:', e);
    return 'An error occurred';
  }
};

export const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      toast.error(getErrorMessage(error) || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = (task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const confirmCompletion = async () => {
    if (!selectedTask) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.createSubmission({
        task_id: selectedTask.id
      });
      toast.success('Task marked as complete!');
      setIsDialogOpen(false);
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error(getErrorMessage(error) || 'Failed to complete task');
    } finally {
      setSubmitting(false);
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
                    <Button onClick={() => handleCompleteTask(task)} data-testid={`submit-task-button-${task.id}`}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Complete
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
                <p className="text-center text-muted-foreground">No completed tasks yet. Start completing!</p>
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
        <DialogContent className="max-w-md" data-testid="submit-task-dialog">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark "{selectedTask?.title}" as complete?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmCompletion} 
              data-testid="submit-task-final-button"
              disabled={submitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {submitting ? 'Completing...' : 'Yes, Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};