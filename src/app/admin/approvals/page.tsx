
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { OrganizerApprovalRequest, Event as EventType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizerRequestCard } from '@/components/admin/OrganizerRequestCard';
import { EventRequestCard } from '@/components/admin/EventRequestCard';
import { UserCheck, CalendarPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ApprovalsPage() {
  const [organizerRequests, setOrganizerRequests] = useState<OrganizerApprovalRequest[]>([]);
  const [eventRequests, setEventRequests] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerCount, setOrganizerCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const firestore = getFirestore();

  useEffect(() => {
    setLoading(true);

    const orgQuery = query(
      collection(firestore, 'approvalRequests'),
      where('type', '==', 'organizer'),
      where('status', '==', 'pending')
    );

    const eventQuery = query(
      collection(firestore, 'events'),
      where('status', '==', 'pending')
    );

    const unsubOrganizers = onSnapshot(orgQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrganizerApprovalRequest[];
      setOrganizerRequests(requests);
      setOrganizerCount(requests.length);
      setLoading(false);
    });

    const unsubEvents = onSnapshot(eventQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
      setEventRequests(requests);
      setEventCount(requests.length);
      setLoading(false);
    });

    return () => {
      unsubOrganizers();
      unsubEvents();
    };
  }, [firestore]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Approval Requests
        </h1>
        <p className="text-muted-foreground">
          Manage pending organizer and event requests.
        </p>
      </div>

      <Tabs defaultValue="organizers" className="w-full">
        <div className="flex items-center justify-between mb-4">
            <TabsList>
            <TabsTrigger value="organizers">
                Organizers
                {organizerCount > 0 && <Badge className="ml-2">{organizerCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="events">
                Events
                {eventCount > 0 && <Badge className="ml-2">{eventCount}</Badge>}
            </TabsTrigger>
            </TabsList>
            <div className="relative ml-auto flex-1 md:grow-0 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search requests..." className="w-full rounded-lg bg-background pl-8" />
            </div>
        </div>

        <TabsContent value="organizers">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : organizerRequests.length > 0 ? (
            <div className="space-y-4">
              {organizerRequests.map((request) => (
                <OrganizerRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card className="flex min-h-[300px] items-center justify-center">
              <CardContent className="p-6 text-center">
                <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Pending Organizer Requests</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The queue is all clear.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="events">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : eventRequests.length > 0 ? (
            <div className="space-y-4">
              {eventRequests.map((event) => (
                <EventRequestCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="flex min-h-[300px] items-center justify-center">
              <CardContent className="p-6 text-center">
                <CalendarPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Pending Event Requests</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The queue is all clear.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
