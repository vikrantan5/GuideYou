import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getSubmissions();
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.updateSubmission(selectedSubmission.id, {
        status: 'approved',
        feedback: feedback
      });
      toast.success('Submission approved');
      setIsDialogOpen(false);
      loadSubmissions();
    } catch (error) {
      console.error('Failed to approve submission:', error);
      toast.error('Failed to approve submission');
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.updateSubmission(selectedSubmission.id, {
        status: 'rejected',
        feedback: feedback
      });
      toast.success('Submission rejected');
      setIsDialogOpen(false);
      loadSubmissions();
    } catch (error) {
      console.error('Failed to reject submission:', error);
      toast.error('Failed to reject submission');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'warning', icon: Clock },
      approved: { variant: 'success', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle }
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold" data-testid="submissions-page-title">Submissions Review</h2>
        <Badge variant="warning" className="text-lg px-4 py-2" data-testid="pending-submissions-badge">
          {pendingCount} Pending
        </Badge>
      </div>

      <Card data-testid="submissions-list-card">
        <CardHeader>
          <CardTitle>All Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id} data-testid={`submission-row-${submission.id}`}>
                    <TableCell className="font-medium">{submission.task_id}</TableCell>
                    <TableCell>{submission.student_id}</TableCell>
                    <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReview(submission)}
                        data-testid={`review-submission-${submission.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="review-submission-dialog">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Submission Content:</h3>
                {selectedSubmission.file_url ? (
                  <div className="border rounded p-4">
                    <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View Submitted File
                    </a>
                  </div>
                ) : (
                  <div className="border rounded p-4 bg-muted">
                    <p>{selectedSubmission.content || 'No content available'}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Feedback:</h3>
                <Textarea
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  data-testid="feedback-textarea"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} data-testid="reject-submission-button">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button variant="default" onClick={handleApprove} data-testid="approve-submission-button">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};