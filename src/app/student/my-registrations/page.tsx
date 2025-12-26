'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Registration } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Search } from 'lucide-react';
import { isPast, isToday, isFuture } from 'date-fns';
import { RegistrationCard } from '@/components/student/RegistrationCard';

export default function MyRegistrationsPage() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const regsQuery = query(
      collection(db, 'registrations'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(regsQuery, (snapshot) => {
      const fetchedRegistrations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Registration[];
      setRegistrations(fetchedRegistrations);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getEventStatus = (eventDate: string) => {
    if (!eventDate) return 'upcoming';
    const date = new Date(eventDate);
    if (isPast(date) && !isToday(date)) return 'past';
    if (isToday(date)) return 'ongoing';
    if (isFuture(date)) return 'upcoming';
    return 'upcoming';
  };

  const filteredRegistrations = useMemo(() => {
    if (activeTab === 'all') return registrations;
    if (activeTab === 'past') {
      return registrations.filter(r => getEventStatus(r.eventDate) === 'past');
    }
    // Upcoming and Ongoing
    return registrations.filter(r => ['upcoming', 'ongoing'].includes(getEventStatus(r.eventDate)));
  }, [registrations, activeTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      );
    }

    if (registrations.length === 0) {
      return (
        <div className="text-center py-20">
          <Ticket className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No registrations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven't registered for any events.
          </p>
          <Button asChild className="mt-6">
            <Link href="/student/events">Browse Events</Link>
          </Button>
        </div>
      );
    }
    
    if (filteredRegistrations.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">No {activeTab} registrations found.</p>;
    }

    return (
      <div className="space-y-4">
        {filteredRegistrations.map(reg => (
          <RegistrationCard key={reg.id} registration={reg} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          My Registrations
        </h1>
        <p className="text-muted-foreground">
          Track and manage all your event registrations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
