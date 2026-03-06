
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  Send,
  Users,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  Megaphone,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotificationsPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAlerts, setSentAlerts] = useState<any[]>([]);
  const [fetchingAlerts, setFetchingAlerts] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all', // 'all', 'student', 'organizer'
  });

  useEffect(() => {
    fetchSentAlerts();
  }, []);

  const fetchSentAlerts = async () => {
    try {
      setFetchingAlerts(true);
      const alertsQuery = query(
        collection(db, 'notifications'),
        where('senderRole', '==', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(alertsQuery);
      const alertsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSentAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch recent alerts.',
      });
    } finally {
      setFetchingAlerts(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || userProfile?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to perform this action.',
      });
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Title and message are required.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: formData.title,
        message: formData.message,
        targetRole: formData.targetRole,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderRole: 'admin',
        isPlatformWide: true,
        readBy: [],
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Notification Sent',
        description: `Your message has been broadcast to ${formData.targetRole} users.`,
      });
      setFormData({
        title: '',
        message: '',
        targetRole: 'all',
      });
      fetchSentAlerts(); // Refresh the list of sent alerts
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send notification.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date?.toDate) return 'Just now';
    const d = date.toDate();
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'student':
        return GraduationCap;
      case 'organizer':
        return UserCheck;
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Platform Notifications
        </h1>
        <p className="text-muted-foreground">
          Send platform-wide announcements and manage all notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Global Announcement</CardTitle>
              <CardDescription>
                This message will be sent to the selected group of users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'all', label: 'Everyone', icon: Users },
                      { value: 'student', label: 'Students', icon: GraduationCap },
                      { value: 'organizer', label: 'Organizers', icon: UserCheck },
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.targetRole === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, targetRole: option.value })}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-6 h-6',
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alert Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Upcoming Maintenance"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Your message here..."
                    rows={5}
                    className="resize-none"
                    maxLength={500}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Announcement
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fetchingAlerts ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : sentAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No alerts sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentAlerts.map((alert) => {
                    const AudienceIcon = getAudienceIcon(alert.targetRole);
                    return (
                      <div
                        key={alert.id}
                        className="p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm mb-1">
                            {alert.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <AudienceIcon className="w-3 h-3" />
                          <span className="capitalize">{alert.targetRole}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
