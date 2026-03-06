
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  BellOff,
  Calendar,
  User,
  Clock,
  CheckCheck,
  Building,
  Globe,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function StudentNotificationsPage() {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
        const myRegistrationIds = userProfile?.registrations || [];

        const allNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isRead: doc.data().readBy?.includes(currentUser.uid) || false
        }));

        // Filter notifications based on relevance
        const relevantNotifications = allNotifications.filter(notif => {
            // Platform-wide notifications from admin
            if (notif.isPlatformWide) {
                if (notif.targetRole === 'all') return true;
                if (notif.targetRole === userProfile?.role) return true;
                return false;
            }
            // Notifications for all attendees of an organizer's events
            if (notif.targetType === 'all-my-attendees') {
                // This would require checking if student is registered for *any* of that organizer's events
                // For simplicity, we can't easily check this on the client-side without many reads
                // A better approach would be to send notifications to a subcollection on the user doc
                // For now, we will show them all to students from organizers
                return notif.senderRole === 'organizer';
            }
            // Event-specific notifications
            if (notif.targetType === 'event' && notif.targetEventId) {
                return myRegistrationIds.includes(notif.targetEventId);
            }
            return true; // Default to showing if logic is complex
        });

        setNotifications(relevantNotifications);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  const markAsRead = async (notificationId: string) => {
    if (!currentUser?.uid) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(currentUser.uid),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.uid) return;

    try {
      const unread = notifications.filter((n) => !n.isRead);
      for (const notif of unread) {
        await markAsRead(notif.id);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return d.toLocaleDateString();
  };
  
  const getSenderIcon = (senderRole: string) => {
    switch(senderRole) {
        case 'admin': return <Globe className="w-4 h-4" />;
        case 'organizer': return <Building className="w-4 h-4" />;
        default: return <User className="w-4 h-4" />;
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={markAllAsRead}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No notifications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You'll see notifications from organizers and admins here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                notification.isRead
                  ? 'bg-card'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <h3
                      className={`font-semibold ${
                        notification.isRead
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      {getSenderIcon(notification.senderRole)}
                      {notification.senderName}
                    </span>
                    {notification.targetEventTitle && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {notification.targetEventTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
