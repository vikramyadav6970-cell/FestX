
'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Event as EventType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { StudentEventCard } from '@/components/student/StudentEventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { isPast, isToday, isFuture } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const categories = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

export default function StudentEventsPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  useEffect(() => {
    setLoading(true);
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchMyRegistrations = async () => {
      try {
        const q = query(collection(db, 'registrations'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const regEventIds = snapshot.docs.map(doc => doc.data().eventId);
        setRegisteredEventIds(regEventIds);
      } catch (error) {
        console.error('Error fetching my registrations:', error);
      }
    };
    fetchMyRegistrations();
  }, [currentUser]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  const getEventStatus = (eventDate: string) => {
    const date = new Date(eventDate);
    if (isPast(date) && !isToday(date)) return 'past';
    if (isToday(date)) return 'ongoing';
    if (isFuture(date)) return 'upcoming';
    return 'upcoming';
  };

  const upcomingEvents = filteredEvents.filter(e => getEventStatus(e.date) === 'upcoming');
  const ongoingEvents = filteredEvents.filter(e => getEventStatus(e.date) === 'ongoing');
  const pastEvents = filteredEvents.filter(e => getEventStatus(e.date) === 'past');

  const renderEventList = (eventList: EventType[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      );
    }
    if (eventList.length === 0) {
      return <p className="text-center text-muted-foreground col-span-full">No events found.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventList.map(event => (
          <StudentEventCard 
            key={event.id} 
            event={event} 
            isRegistered={registeredEventIds.includes(event.id)}
            checkingRegistration={checkingRegistration}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Discover Events
        </h1>
        <p className="text-muted-foreground">
          Browse and find your next experience.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by event title..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">{renderEventList(upcomingEvents)}</TabsContent>
        <TabsContent value="ongoing" className="mt-6">{renderEventList(ongoingEvents)}</TabsContent>
        <TabsContent value="past" className="mt-6">{renderEventList(pastEvents)}</TabsContent>
        <TabsContent value="all" className="mt-6">{renderEventList(filteredEvents)}</TabsContent>
      </Tabs>
    </div>
  );
}
