'use client';

import type { Event } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock, Info } from 'lucide-react';
import { ApprovalActions } from './ApprovalActions';

interface EventRequestCardProps {
  event: Event;
}

export function EventRequestCard({ event }: EventRequestCardProps) {
  const eventDate = new Date(event.date);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                 <CardTitle className="font-headline text-xl">{event.title}</CardTitle>
                <CardDescription>by {event.organizer}</CardDescription>
            </div>
            <Badge variant="secondary">{event.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{event.description}</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{eventDate.toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{eventDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Organized by {event.organizer}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Requested on:{' '}
            {event.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}
          </div>
          <ApprovalActions
            requestType="event"
            requestId={event.id} // Assuming the doc id is the event id
            targetEventId={event.id}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
