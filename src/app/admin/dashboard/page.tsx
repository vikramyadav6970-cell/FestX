
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  GraduationCap,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  BarChart as BarChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';


const chartData = [
  { name: 'Jan', total: 0 },
  { name: 'Feb', total: 0 },
  { name: 'Mar', total: 0 },
  { name: 'Apr', total: 0 },
  { name: 'May', total: 0 },
  { name: 'Jun', total: 0 },
  { name: 'Jul', total: 0 },
  { name: 'Aug', total: 0 },
  { name: 'Sep', total: 0 },
  { name: 'Oct', total: 0 },
  { name: 'Nov', total: 0 },
  { name: 'Dec', total: 0 },
];

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    pendingOrganizerRequests: 0,
    pendingEventRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());
        const totalUsers = users.length;
        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalOrganizers = users.filter(u => u.role === 'organizer').length;

        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const events = eventsSnapshot.docs.map(doc => doc.data());
        const totalEvents = events.length;

        // Fetch pending requests
        const orgRequestsQuery = query(collection(db, 'approvalRequests'), where('status', '==', 'pending'));
        const orgRequestsSnapshot = await getDocs(orgRequestsQuery);
        const pendingOrganizerRequests = orgRequestsSnapshot.size;

        const eventRequestsQuery = query(collection(db, 'events'), where('status', '==', 'pending'));
        const eventRequestsSnapshot = await getDocs(eventRequestsQuery);
        const pendingEventRequests = eventRequestsSnapshot.size;

        setStats({
          totalUsers,
          totalStudents,
          totalOrganizers,
          totalEvents,
          pendingOrganizerRequests,
          pendingEventRequests,
        });

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Platform-wide overview and statistics.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Total Events" value={stats.totalEvents} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Organizers" value={stats.totalOrganizers} icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Students" value={stats.totalStudents} icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />} />
      </div>

      {(stats.pendingEventRequests > 0 || stats.pendingOrganizerRequests > 0) && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-yellow-900 dark:text-yellow-200">Pending Approvals</CardTitle>
                <p className="text-yellow-700 dark:text-yellow-400">There are items requiring your attention.</p>
            </div>
            <Button asChild>
                <Link href="/admin/approvals">Review Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            </CardHeader>
            <CardContent className="flex gap-8">
                <p><strong>{stats.pendingOrganizerRequests}</strong> organizer requests</p>
                <p><strong>{stats.pendingEventRequests}</strong> event requests</p>
            </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Events Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground py-20">
              <p>No recent platform activity.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
