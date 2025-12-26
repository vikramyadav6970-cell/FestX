
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Send,
  Inbox,
  Clock,
  CheckCheck,
  User,
  AlertTriangle,
  Info,
  ChevronRight,
  Loader2,
  Users,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizerNotificationsPage() {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    // Fetch received notifications for organizers
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const allNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isRead: doc.data().readBy?.includes(currentUser.uid) || false,
      }));

      // Filter on the client side
      const relevantNotifications = allNotifications.filter(notif => {
        const isAdminSender = notif.senderRole === 'admin';
        const isForOrganizers = notif.targetRole === 'organizer' || notif.targetRole === 'all';
        return isAdminSender && isForOrganizers;
      });

      setNotifications(relevantNotifications);
      setLoading(false);
    });

    // Fetch sent notifications by the organizer
    const sentQuery = query(
      collection(db, 'notifications'),
      where('senderId', '==', currentUser.uid)
    );

    const unsubSent = onSnapshot(sentQuery, (snapshot) => {
      const fetchedSentNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
       // Sort on the client side
      fetchedSentNotifications.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSentNotifications(fetchedSentNotifications);
    });

    return () => {
      unsubNotifications();
      unsubSent();
    };
  }, [currentUser]);

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
    const unread = notifications.filter((n) => !n.isRead);
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date?.toDate) return '';
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with platform alerts and manage your sent messages.
          </p>
        </div>
        <Button asChild>
          <Link href="/organizer/send-notification">
            <Send className="mr-2 h-4 w-4" />
            Send Notification
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox">
            <Inbox className="mr-2 h-4 w-4" />
            Inbox
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="mr-2 h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Received Alerts</CardTitle>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16">
                  <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No alerts yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You'll see notifications from admins here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                      className={`rounded-xl border p-4 cursor-pointer transition-all ${
                        notification.isRead
                          ? 'bg-card'
                          : 'bg-primary/5 border-primary/20'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary/20">
                          {!notification.isRead && <div className="h-full w-full rounded-full bg-primary animate-pulse"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" />
                            From: {notification.senderName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {sentNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No sent notifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Messages you send to attendees will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentNotifications.map((notification) => (
                    <div key={notification.id} className="rounded-xl border p-4">
                       <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <div className="mt-3 flex items-center gap-2">
                           <Badge variant="outline">To: {notification.targetEventTitle || 'All My Attendees'}</Badge>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
