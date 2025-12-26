
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Event as EventType, Registration } from '@/types';
import Link from 'next/link';

import { 
  ArrowLeft, 
  Users, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle,
  Filter,
  Eye,
  Mail,
  Phone,
  User,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
);


export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();

  const [event, setEvent] = useState<EventType | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const fetchEventAndRegistrations = async () => {
        try {
            setLoading(true);

            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (eventDoc.exists()) {
                setEvent({ id: eventDoc.id, ...eventDoc.data() } as EventType);
            } else {
                 router.push('/organizer/my-events');
            }

            const registrationsQuery = query(
                collection(db, 'registrations'),
                where('eventId', '==', eventId)
            );
            const registrationsSnapshot = await getDocs(registrationsQuery);
            const registrationsData = registrationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Registration[];

            registrationsData.sort((a, b) => 
                (b.registeredAt?.toDate()?.getTime() || 0) - (a.registeredAt?.toDate()?.getTime() || 0)
            );

            setRegistrations(registrationsData);

        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchEventAndRegistrations();
  }, [eventId, router]);

  useEffect(() => {
    let filtered = [...registrations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.userName?.toLowerCase().includes(term) ||
        reg.userEmail?.toLowerCase().includes(term) ||
        reg.userRollNo?.toLowerCase().includes(term) ||
        reg.userPhone?.includes(term)
      );
    }

    if (filterStatus === 'attended') {
      filtered = filtered.filter(reg => reg.attended === true);
    } else if (filterStatus === 'notAttended') {
      filtered = filtered.filter(reg => !reg.attended);
    } else if (filterStatus === 'paid') {
      filtered = filtered.filter(reg => reg.paymentStatus === 'paid');
    } else if (filterStatus === 'pendingPayment') {
      filtered = filtered.filter(reg => reg.paymentStatus === 'pending');
    }

    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, filterStatus]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
    });
  };
  
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Roll No', 'Registered At', 'Attended', 'Payment Status'];
    const rows = filteredRegistrations.map(reg => [
      `"${reg.userName}"`,
      `"${reg.userEmail}"`,
      `"${reg.userPhone}"`,
      `"${reg.userRollNo}"`,
      `"${formatDate(reg.registeredAt)}"`,
      reg.attended ? 'Yes' : 'No',
      `"${reg.paymentStatus || 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.title || 'event'}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: registrations.length,
    attended: registrations.filter(r => r.attended).length,
    notAttended: registrations.filter(r => !r.attended).length,
    paid: registrations.filter(r => r.paymentStatus === 'paid').length
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/organizer/my-events">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                <h1 className="font-headline text-3xl font-bold text-foreground">
                    {event?.title || 'Event Registrations'}
                </h1>
                <p className="text-muted-foreground">
                    {event?.location} • {event?.date && formatDate(event.date)}
                </p>
                </div>
            </div>
            <Button onClick={exportToCSV} disabled={registrations.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Registered" value={stats.total} icon={<Users className="text-muted-foreground" />} />
            <StatCard title="Attended" value={stats.attended} icon={<CheckCircle className="text-green-500" />} />
            <StatCard title="Not Attended" value={stats.notAttended} icon={<XCircle className="text-amber-500" />} />
            {event?.isPaid && <StatCard title="Paid" value={stats.paid} icon={<CheckCircle className="text-indigo-500" />} />}
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, roll no..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="notAttended">Not Attended</SelectItem>
                                {event?.isPaid && <SelectItem value="paid">Paid</SelectItem>}
                                {event?.isPaid && <SelectItem value="pendingPayment">Pending Payment</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>Attendance</TableHead>
                                {event?.isPaid && <TableHead>Payment</TableHead>}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={event?.isPaid ? 7 : 6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredRegistrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={event?.isPaid ? 7 : 6} className="h-24 text-center">
                                        No registrations match your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRegistrations.map((reg, index) => (
                                <TableRow key={reg.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{reg.userName}</div>
                                        <div className="text-sm text-muted-foreground">{reg.userEmail}</div>
                                    </TableCell>
                                    <TableCell>{reg.userRollNo}</TableCell>
                                    <TableCell>{formatDate(reg.registeredAt)}</TableCell>
                                    <TableCell>
                                         {reg.attended ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                Attended
                                            </span>
                                            ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                                                <XCircle className="w-3 h-3" />
                                                Not Attended
                                            </span>
                                            )}
                                    </TableCell>
                                    {event?.isPaid && (
                                        <TableCell>
                                            <Badge variant={reg.paymentStatus === 'paid' ? 'default' : 'secondary'} className={reg.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                                {reg.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedRegistration(reg)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        
        <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Registration Details</DialogTitle>
                </DialogHeader>
                {selectedRegistration && (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{selectedRegistration.userName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{selectedRegistration.userEmail}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{selectedRegistration.userPhone}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Hash className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Roll No</p>
                                <p className="font-medium">{selectedRegistration.userRollNo}</p>
                            </div>
                        </div>
                        {selectedRegistration.formResponses && Object.keys(selectedRegistration.formResponses).length > 0 && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Custom Form Responses</p>
                                <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                                {Object.entries(selectedRegistration.formResponses).map(([key, value]) => (
                                    <div key={key}>
                                    <span className="font-semibold">{key}: </span>
                                    <span>{String(value)}</span>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedRegistration(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
  );
};
