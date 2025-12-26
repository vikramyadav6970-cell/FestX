
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Event } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Search, PlusCircle } from 'lucide-react';
import { isPast, isToday, isFuture } from 'date-fns';
import { OrganizerEventCard } from '@/components/organizer/OrganizerEventCard';

export default function MyEventsPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const eventsQuery = query(
      collection(db, 'events'),
      where('organizerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getEventPeriod = (eventDate?: string) => {
    if (!eventDate) return 'upcoming';
    const date = new Date(eventDate);
    if (isPast(date) && !isToday(date)) return 'past';
    return 'future';
  };

  const filteredEvents = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return events.filter(e => e.status === 'approved' && getEventPeriod(e.date) === 'future');
      case 'pending':
        return events.filter(e => e.status === 'pending');
      case 'completed':
        return events.filter(e => e.status === 'approved' && getEventPeriod(e.date) === 'past');
      case 'rejected':
        return events.filter(e => e.status === 'rejected');
      case 'all':
      default:
        return events;
    }
  }, [events, activeTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No events created yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first event.
          </p>
          <Button asChild className="mt-6">
            <Link href="/organizer/create-event">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Event
            </Link>
          </Button>
        </div>
      );
    }
    
    if (filteredEvents.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">No events in this category.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => (
          <OrganizerEventCard key={event.id} event={event} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
            My Events
            </h1>
            <p className="text-muted-foreground">
            Track and manage all your created events.
            </p>
        </div>
         <Button asChild>
            <Link href="/organizer/create-event">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
            </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <div className="mt-6">
            {renderContent()}
        </div>
      </Tabs>
    </div>
  );
}
