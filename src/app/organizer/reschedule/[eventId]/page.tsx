
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, MapPin, AlertTriangle, CheckCircle, Loader2, ArrowLeft, RefreshCw, Bell } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Event as EventType, Registration } from '@/types';
import { format } from 'date-fns';


const venues = [
    'Main Auditorium', 'Seminar Hall A', 'Seminar Hall B', 'Conference Room', 'Open Ground',
    'Sports Complex', 'Computer Lab 1', 'Computer Lab 2', 'Library Hall', 'Cafeteria', 'Other'
];

export default function RescheduleEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingVenue, setCheckingVenue] = useState(false);
  const [venueAvailable, setVenueAvailable] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date(),
    startTime: '',
    endTime: '',
    venue: '',
    rescheduleReason: ''
  });

  useEffect(() => {
    if (!eventId || !currentUser) return;
    
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists() || eventDoc.data().organizerId !== currentUser.uid) {
          toast({ variant: 'destructive', title: 'Error', description: 'Event not found or you do not have permission to edit it.' });
          router.push('/organizer/my-events');
          return;
        }

        const eventData = { id: eventDoc.id, ...eventDoc.data() } as EventType;
        setEvent(eventData);
        setFormData({
          date: new Date(eventData.date),
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          venue: eventData.location,
          rescheduleReason: '',
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading event' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, currentUser, router, toast]);

  useEffect(() => {
    if (formData.date && formData.startTime && formData.venue && event) {
      checkVenueAvailability();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date, formData.startTime, formData.endTime, formData.venue]);

  const checkVenueAvailability = async () => {
    setCheckingVenue(true);
    setVenueAvailable(null);

    try {
      const q = query(
        collection(db, 'events'), 
        where('status', 'in', ['approved', 'pending']),
        where('location', '==', formData.venue)
      );
      const eventsSnapshot = await getDocs(q);
      const conflicts = eventsSnapshot.docs.filter(docSnap => {
        if (docSnap.id === eventId) return false;
        const e = docSnap.data();
        const eventDate = new Date(e.date);
        const selectedDate = new Date(formData.date);
        if(eventDate.toDateString() !== selectedDate.toDateString()) return false;
        const hasOverlap = !(formData.endTime <= e.startTime || formData.startTime >= e.endTime);
        return hasOverlap;
      });

      setVenueAvailable(conflicts.length === 0);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error checking venue availability' });
    } finally {
      setCheckingVenue(false);
    }
  };

  const notifyRegisteredStudents = async (oldDetails: any, newDetails: any) => {
    const regsQuery = query(collection(db, 'registrations'), where('eventId', '==', eventId));
    const regsSnapshot = await getDocs(regsQuery);
    if (regsSnapshot.empty) return 0;

    const batch = writeBatch(db);
    let notifiedCount = 0;
    
    regsSnapshot.forEach(docSnap => {
      notifiedCount++;
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        title: `📅 Event Rescheduled: ${event?.title}`,
        message: `Reason: ${formData.rescheduleReason || 'Update from organizer'}. Old: ${oldDetails.date} at ${oldDetails.time}, ${oldDetails.venue}. New: ${newDetails.date} at ${newDetails.time}, ${newDetails.venue}.`,
        targetType: 'specific-user',
        targetUserId: docSnap.data().userId,
        targetEventId: eventId,
        senderId: currentUser?.uid,
        senderName: userProfile?.name,
        senderRole: 'organizer',
        readBy: [],
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return notifiedCount;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime || !formData.venue || !formData.rescheduleReason.trim()) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields, including the reason for rescheduling.' });
      return;
    }
    if (venueAvailable === false) {
      toast({ variant: 'destructive', title: 'Venue Conflict', description: 'Selected venue is not available at this time. Please choose another slot.' });
      return;
    }

    setSaving(true);
    try {
      const oldDetails = {
        date: format(new Date(event!.date), 'PPP'),
        time: `${event!.startTime} - ${event!.endTime || 'TBD'}`,
        venue: event!.location
      };
      const newDetails = {
        date: format(new Date(formData.date), 'PPP'),
        time: `${formData.startTime} - ${formData.endTime || 'TBD'}`,
        venue: formData.venue
      };

      await updateDoc(doc(db, 'events', eventId), {
        date: formData.date.toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime || '',
        location: formData.venue,
        status: 'pending', // Re-submit for approval after rescheduling
        rescheduledAt: serverTimestamp(),
        rescheduleReason: formData.rescheduleReason,
      });

      const notifiedCount = await notifyRegisteredStudents(oldDetails, newDetails);

      toast({ title: 'Event Resubmitted', description: `Your event has been resubmitted for approval. ${notifiedCount} registered student(s) have been notified.` });
      router.push('/organizer/my-events');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to Reschedule', description: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>;
  }
  
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/organizer/my-events"><ArrowLeft className="mr-2 h-4 w-4" />Back to My Events</Link>
      </Button>

      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">Reschedule Event</h1>
        <p className="text-muted-foreground">{event?.title}</p>
      </div>

       {event?.hasConflict && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required: Scheduling Conflict</AlertTitle>
            <AlertDescription>{event.conflictReason || 'This event has a scheduling conflict with an official event. Please choose a new date, time, or venue.'}</AlertDescription>
          </Alert>
        )}

      <Card>
        <CardHeader>
            <CardTitle>Current Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
             <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{format(new Date(event!.date), 'PPP')}</span></div>
             <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>{event?.startTime} - {event?.endTime || 'TBD'}</span></div>
             <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{event?.location}</span></div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>New Schedule</CardTitle>
                <CardDescription>Select a new date, time, and venue for your event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-medium text-sm">New Date*</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={'outline'} className={cn('justify-start text-left font-normal', !formData.date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date} onSelect={(d) => setFormData(p => ({...p, date: d!}))} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                     <div>
                        <label className="font-medium text-sm mb-2 block">New Venue*</label>
                        <Select value={formData.venue} onValueChange={(v) => setFormData(p => ({...p, venue: v}))}>
                            <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                            <SelectContent>
                                {venues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <label className="font-medium text-sm mb-2 block">Start Time*</label>
                        <Input type="time" value={formData.startTime} onChange={(e) => setFormData(p => ({...p, startTime: e.target.value}))} />
                    </div>
                    <div>
                        <label className="font-medium text-sm mb-2 block">End Time*</label>
                        <Input type="time" value={formData.endTime} onChange={(e) => setFormData(p => ({...p, endTime: e.target.value}))} />
                    </div>
                </div>
                 {checkingVenue && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Checking venue availability...</p>}
                {!checkingVenue && venueAvailable === true && <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Venue is available!</p>}
                {!checkingVenue && venueAvailable === false && <p className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Venue is not available at this time.</p>}
                
                <div>
                     <label className="font-medium text-sm mb-2 block">Reason for Rescheduling*</label>
                     <Textarea placeholder="e.g., Unavoidable scheduling conflict..." value={formData.rescheduleReason} onChange={(e) => setFormData(p => ({...p, rescheduleReason: e.target.value}))} />
                     <p className="text-xs text-muted-foreground mt-1">This reason will be shared with registered students.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={saving || venueAvailable === false}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><RefreshCw className="mr-2 h-4 w-4" />Confirm Reschedule</>}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}

