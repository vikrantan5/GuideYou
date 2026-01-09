import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Megaphone, Trash2, Calendar } from 'lucide-react';
import * as api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.getAnnouncements();
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.createAnnouncement(formData);
      toast.success('Announcement created successfully');
      setIsDialogOpen(false);
      setFormData({ title: '', content: '' });
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to create announcement:', error);
      toast.error(error.response?.data?.detail || 'Failed to create announcement');
    }
  };

  const handleDelete = async (announcementId) => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.deleteAnnouncement(announcementId);
      toast.success('Announcement deleted successfully');
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold" data-testid="announcements-page-title">Announcements</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-announcement-dialog-trigger" className="w-full sm:w-auto">
              <Megaphone className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" data-testid="create-announcement-dialog">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Important Update"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  data-testid="announcement-title-input"
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-sm sm:text-base">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Write your announcement here..."
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  required
                  data-testid="announcement-content-input"
                  className="text-sm sm:text-base"
                />
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" data-testid="submit-create-announcement-button" className="w-full sm:w-auto">Publish</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground text-sm sm:text-base">No announcements yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} data-testid={`announcement-card-${announcement.id}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl">{announcement.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {new Date(announcement.created_at).toLocaleString()}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`delete-announcement-${announcement.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm mx-4">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Are you sure you want to delete this announcement? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="w-full sm:w-auto">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap break-words">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};