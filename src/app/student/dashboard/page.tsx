
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  Calendar, 
  CheckCircle, 
  Clock,
  QrCode,
  Bell,
  CalendarDays,
  ArrowRight,
  Sparkles,
  Ticket,
  BarChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Registration, Event as EventType } from '@/types';


const StatCard = ({ title, value, icon, link }: { title: string, value: string | number, icon: React.ReactNode, link: string }) => (
  <Link href={link || '#'}>
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  </Link>
);


export default function StudentDashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    upcomingEvents: 0,
    attendedEvents: 0,
  });
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<Registration[]>([]);
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

      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('userId', '==', currentUser.uid)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];

      const totalRegistrations = registrations.length;
      const attendedEvents = registrations.filter(r => r.attended === true).length;
      
      const now = new Date();
      const upcomingRegs = registrations
        .filter(reg => new Date(reg.eventDate) > now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      setStats({
        totalRegistrations,
        upcomingEvents: upcomingRegs.length,
        attendedEvents,
      });

      setUpcomingRegistrations(upcomingRegs.slice(0, 3));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
   const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Welcome back, {userProfile?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your event activities.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
            title="Events Registered" 
            value={loading ? '...' : stats.totalRegistrations} 
            icon={<Ticket className="h-4 w-4 text-muted-foreground" />} 
            link="/student/my-registrations"
        />
        <StatCard 
            title="Upcoming Events" 
            value={loading ? '...' : stats.upcomingEvents} 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            link="/student/my-registrations"
        />
        <StatCard 
            title="Events Attended" 
            value={loading ? '...' : stats.attendedEvents} 
            icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
            link="/student/my-registrations"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
               <Button asChild variant="ghost" size="sm">
                <Link href="/student/my-registrations">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
               {loading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                 </div>
                ) : upcomingRegistrations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    <Calendar className="mx-auto h-12 w-12" />
                    <p className="mt-4">You have no upcoming registered events.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/student/events">Browse Events</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{reg.eventTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(reg.eventDate)} • {reg.eventLocation}
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/student/my-qrcodes">
                            <QrCode className="w-4 h-4 mr-2" />
                            Ticket
                          </Link>
                        </Button>
                      </div>
                    ))}
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
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/student/events"><Calendar className="mr-2 h-4 w-4" /> Browse Events</Link>
                    </Button>
                     <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/student/my-qrcodes"><QrCode className="mr-2 h-4 w-4" /> My QR Codes</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/student/my-registrations"><Ticket className="mr-2 h-4 w-4" /> My Registrations</Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-10">
                    <Bell className="mx-auto h-12 w-12" />
                    <p className="mt-4">You have no unread notifications.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};
