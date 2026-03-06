
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, MapPin, Users, Ticket, CircleDollarSign } from 'lucide-react';
import type { EventFormValues } from '@/app/organizer/create-event/page';
import { useAuth } from '@/hooks/useAuth';

interface CreateEventStep4Props {
  eventData: EventFormValues;
}

export function CreateEventStep4({ eventData }: CreateEventStep4Props) {
  const { userProfile } = useAuth();
  const bannerPreview = eventData.bannerImage?.[0] ? URL.createObjectURL(eventData.bannerImage[0]) : `https://picsum.photos/seed/event-preview/600/400`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Please review all the information below before submitting for approval. This is how your event card will appear to students.
        </p>
        
        <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
          <CardHeader className="relative h-48 w-full p-0">
            <Image
              src={bannerPreview}
              alt={eventData.title || 'Event Banner Preview'}
              fill
              className="object-cover"
            />
            {eventData.category && <Badge variant="secondary" className="absolute top-2 right-2">{eventData.category}</Badge>}
          </CardHeader>
          <CardContent className="flex-1 space-y-3 pt-6">
            <CardTitle className="font-headline text-xl">{eventData.title || "Your Event Title"}</CardTitle>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{eventData.date ? new Date(eventData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date'} at {eventData.startTime || "Time"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{eventData.location === 'Other' ? eventData.otherLocation : eventData.location || 'Venue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Organized by {eventData.societyName || "Society/Club"}</span>
              </div>
              {eventData.isPaid && (
                 <div className="flex items-center gap-2 text-primary font-semibold">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Paid Event: ₹{eventData.entryFee}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-primary font-semibold">Event Preview</p>
          </CardFooter>
        </Card>

        <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Registration Form Preview</h3>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Name (Default)</li>
                <li>Email (Default)</li>
                <li>Phone (Default)</li>
                <li>Roll No (Default)</li>
                {eventData.customFields?.map((field, index) => (
                    <li key={index}>
                        {field.label} {field.required ? <span className="text-destructive">*</span> : ''}
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
