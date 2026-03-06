
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  Users,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Event } from '@/types';
import { useToast } from '@/hooks/use-toast';

const StatCard = ({ title, value, color }: { title: string, value: number, color?: string }) => (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );

export default function EventCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState('month'); // 'month', 'list'
  const { toast } = useToast();

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(eventsQuery);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch events.' });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay, year, month };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.date ? new Date(event.date) : new Date();
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };
  
  const formatDate = (date: string | Date) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'events', eventId), { status: 'rejected', rejectionReason: 'Cancelled by Admin' });
      await fetchAllEvents();
      setSelectedEvent(null);
      toast({ title: 'Event Cancelled', description: 'The event has been marked as rejected.' });
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel the event.' });
    }
  };

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(new Date(year, month, day));

  const stats = {
    total: events.length,
    approved: events.filter(e => e.status === 'approved').length,
    pending: events.filter(e => e.status === 'pending').length,
    thisMonth: events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }).length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">Admin Event Calendar</h1>
            <p className="text-muted-foreground">View and manage all events on the platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          {['month', 'list'].map(viewName => (
            <Button
              key={viewName}
              onClick={() => setView(viewName)}
              variant={view === viewName ? 'secondary' : 'ghost'}
              className="capitalize"
            >
              {viewName}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats.total} />
        <StatCard title="Approved" value={stats.approved} color="text-green-600" />
        <StatCard title="Pending" value={stats.pending} color="text-yellow-600" />
        <StatCard title="This Month" value={stats.thisMonth} color="text-indigo-600" />
      </div>

      {view === 'month' ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Button variant="outline" size="icon" onClick={previousMonth}><ChevronLeft /></Button>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{monthNames[month]} {year}</h2>
                <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight /></Button>
            </div>
            <div className="grid grid-cols-7 border-b">
              {dayNames.map(day => <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const isToday = date?.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={index}
                    onClick={() => date && dayEvents.length > 0 && setSelectedDate(date)}
                    className={`min-h-[120px] p-2 border-b border-r border-border/50 transition-colors ${date ? 'cursor-pointer hover:bg-muted/50' : 'bg-muted/30'}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                              className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getStatusBadgeClass(event.status)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && <div className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                  ) : events.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No events found.</TableCell></TableRow>
                  ) : (
                    events.map(event => (
                      <TableRow key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                        <TableCell>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.societyName}</p>
                        </TableCell>
                        <TableCell>
                          <p>{formatDate(event.date)}</p>
                          <p className="text-sm text-muted-foreground">{event.startTime} - {event.endTime}</p>
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.organizer}</TableCell>
                        <TableCell><Badge className={getStatusBadgeClass(event.status)}>{event.status}</Badge></TableCell>
                        <TableCell>{event.registrationCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
        </Card>
      )}

      {/* Modals */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Events on {selectedDate && formatDate(selectedDate)}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedDate && getEventsForDate(selectedDate).map(event => (
              <div key={event.id} onClick={() => { setSelectedDate(null); setSelectedEvent(event); }} className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.startTime} at {event.location}</p>
                    </div>
                    <Badge className={getStatusBadgeClass(event.status)}>{event.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
       <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>{selectedEvent?.societyName}</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <>
              <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Badge className={getStatusBadgeClass(selectedEvent.status)}>{selectedEvent.status}</Badge></div>
                {selectedEvent.isPaid && <div className="flex items-center gap-2"><Badge variant="outline">₹{selectedEvent.amount}</Badge></div>}
                <div className="flex items-start gap-2"><CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground" /> <span>{formatDate(selectedEvent.date)} from {selectedEvent.startTime} to {selectedEvent.endTime}</span></div>
                <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /> <span>{selectedEvent.location}</span></div>
                <div className="flex items-start gap-2"><User className="h-4 w-4 mt-0.5 text-muted-foreground" /> <span>{selectedEvent.organizer} ({selectedEvent.organizerEmail})</span></div>
                <div className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 text-muted-foreground" /> <span>{selectedEvent.registrationCount || 0} Registrations</span></div>
                <div className="col-span-full pt-2 border-t">
                    <p className="font-medium">Description</p>
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
                {selectedEvent.status === 'approved' && <Button variant="destructive" onClick={() => handleCancelEvent(selectedEvent.id)}><XCircle className="mr-2 h-4 w-4"/>Cancel Event</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
