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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold" data-testid="submissions-page-title">Submissions Review</h2>
        <Badge variant="warning" className="text-base sm:text-lg px-3 sm:px-4 py-2 w-fit" data-testid="pending-submissions-badge">
          {pendingCount} Pending
        </Badge>
      </div>

      <Card data-testid="submissions-list-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">No submissions yet.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} data-testid={`submission-card-${submission.id}`} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-base">Task: {submission.task_id}</h3>
                          <p className="text-sm text-muted-foreground">Student: {submission.student_id}</p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(submission)}
                        data-testid={`review-submission-mobile-${submission.id}`}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Submission
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" data-testid="review-submission-dialog">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Submission Content:</h3>
                {selectedSubmission.file_url ? (
                  <div className="border rounded p-4">
                    <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm sm:text-base">
                      View Submitted File
                    </a>
                  </div>
                ) : (
                  <div className="border rounded p-4 bg-muted">
                    <p className="text-sm sm:text-base">{selectedSubmission.content || 'No content available'}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Feedback:</h3>
                <Textarea
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  data-testid="feedback-textarea"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button variant="destructive" onClick={handleReject} data-testid="reject-submission-button" className="w-full sm:w-auto">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button variant="default" onClick={handleApprove} data-testid="approve-submission-button" className="w-full sm:w-auto">
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