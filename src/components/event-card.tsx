
import Image from "next/image";
import type { Event } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="relative h-48 w-full p-0">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          data-ai-hint={event.imageHint}
        />
        <Badge variant="secondary" className="absolute top-2 right-2">{event.category}</Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-6">
        <CardTitle className="font-headline text-xl">{event.title}</CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
      <CardFooter>
        <Button className="w-full" variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  );
}
