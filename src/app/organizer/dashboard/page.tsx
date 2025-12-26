
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  PlusCircle,
  QrCode,
  TrendingUp,
  ArrowRight,
  Sparkles,
  AlertCircle,
  BarChart,
  XCircle
} from 'lucide-react';
import type { Event } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon, link, loading }: { title: string, value: string | number, icon: React.ReactNode, link?: string, loading: boolean }) => {
  const cardContent = (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
      </CardContent>
    </Card>
  );

  return link ? <Link href={link}>{cardContent}</Link> : <div>{cardContent}</div>;
};

export default function OrganizerDashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    totalRegistrations: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);

      const eventsQuery = query(
        collection(db, 'events'),
        where('organizerId', '==', currentUser.uid)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      const totalEvents = events.length;
      const approvedEvents = events.filter(e => e.status === 'approved').length;
      const pendingEvents = events.filter(e => e.status === 'pending').length;
      const rejectedEvents = events.filter(e => e.status === 'rejected').length;

      let totalRegistrations = 0;
      events.forEach(event => {
        totalRegistrations += event.registrationCount || 0;
      });
      
      const recentEventsData = events
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, 5);

      setStats({
        totalEvents,
        approvedEvents,
        pendingEvents,
        rejectedEvents,
        totalRegistrations,
      });

      setRecentEvents(recentEventsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Welcome back, {userProfile?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your events for {userProfile?.societyName}.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Events" value={stats.totalEvents} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} loading={loading} link="/organizer/my-events" />
        <StatCard title="Approved Events" value={stats.approvedEvents} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} loading={loading} link="/organizer/my-events" />
        <StatCard title="Pending Review" value={stats.pendingEvents} icon={<Clock className="h-4 w-4 text-muted-foreground" />} loading={loading} link="/organizer/my-events" />
        <StatCard title="Total Registrations" value={stats.totalRegistrations} icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Events</CardTitle>
               <Button asChild variant="ghost" size="sm">
                <Link href="/organizer/my-events">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                 </div>
              ) : recentEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  <p>You haven&apos;t created any events yet.</p>
                     <Button asChild variant="link" className="mt-2">
                      <Link href="/organizer/create-event">Create your first event</Link>
                  </Button>
                </div>
              ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-muted-foreground border-b">
                            <th className="pb-3 font-medium">Event</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Registrations</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                        {recentEvents.map((event) => (
                            <tr key={event.id}>
                            <td className="py-3">
                                <p className="font-medium text-foreground">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                            </td>
                            <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(event.status)}`}>
                                {event.status}
                                </span>
                            </td>
                            <td className="py-3 text-muted-foreground">
                                {event.registrationCount || 0}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button asChild className="w-full justify-start">
                        <Link href="/organizer/create-event"><PlusCircle className="mr-2 h-4 w-4" /> Create New Event</Link>
                    </Button>
                     <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/organizer/my-events"><Calendar className="mr-2 h-4 w-4" /> View All Events</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/organizer/scanner"><QrCode className="mr-2 h-4 w-4" /> QR Scanner</Link>
                    </Button>
                </CardContent>
            </Card>
            {stats.rejectedEvents > 0 && (
                <Card className="bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
                            <XCircle className="h-5 w-5" />
                            Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-700 dark:text-red-400">You have {stats.rejectedEvents} event(s) that were rejected. Please review and resubmit them.</p>
                         <Button asChild variant="secondary" size="sm" className="mt-4">
                            <Link href="/organizer/my-events">Review Rejected Events</Link>
                         </Button>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
};
