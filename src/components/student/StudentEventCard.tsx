
'use client';
import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, CircleDollarSign, CheckCircle, Ticket, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentEventCardProps {
  event: Event;
  isRegistered: boolean;
  checkingRegistration: boolean;
}

export function StudentEventCard({ event, isRegistered, checkingRegistration }: StudentEventCardProps) {
  const eventDate = new Date(event.date);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="relative h-48 w-full p-0">
        <Link href={`/student/register/${event.id}`}>
          <Image
            src={event.imageUrl || 'https://picsum.photos/seed/event/600/400'}
            alt={event.title}
            fill
            className="object-cover"
            data-ai-hint={event.imageHint}
          />
        </Link>
        <div className="absolute top-2 right-2 flex gap-2">
            {event.isPaid && <Badge className="bg-primary hover:bg-primary/80"><CircleDollarSign className="h-3 w-3 mr-1" /> Paid</Badge>}
            <Badge variant="secondary">{event.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-6">
        <CardTitle className="font-headline text-xl leading-tight">
             <Link href={`/student/register/${event.id}`} className="hover:text-primary transition-colors">
                {event.title}
            </Link>
        </CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{eventDate.toLocaleDateString('en-US', { dateStyle: 'medium' })} @ {event.startTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Organized by {event.organizer}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
         <p className="text-xs text-muted-foreground">{event.registrationCount || 0} students registered.</p>
        {isRegistered ? (
             <Button disabled className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100">
                <CheckCircle className="mr-2 h-4 w-4" />
                Registered
            </Button>
        ) : (
            <Button asChild className="w-full" disabled={checkingRegistration}>
                <Link href={`/student/register/${event.id}`}>
                {checkingRegistration ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                    </>
                ) : (
                    <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Register Now
                    <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                )}
                </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
