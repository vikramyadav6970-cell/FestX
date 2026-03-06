
'use client';
import type { Registration } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, QrCode, Ticket, Check, CircleDollarSign, Clock, Hourglass } from 'lucide-react';
import { isPast, isToday, isFuture, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { QRCodeDialog } from './QRCodeDialog';

interface RegistrationCardProps {
  registration: Registration;
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
    
  const getEventStatus = () => {
    if (!registration.eventDate) return { text: 'Upcoming', color: 'bg-blue-500' };
    const date = new Date(registration.eventDate);
    if (isPast(date) && !isToday(date)) return { text: 'Past', color: 'bg-gray-500' };
    if (isToday(date)) return { text: 'Today', color: 'bg-green-500' };
    if (isFuture(date)) return { text: 'Upcoming', color: 'bg-blue-500' };
    return { text: 'Upcoming', color: 'bg-blue-500' };
  };

  const getPaymentStatus = () => {
    switch (registration.paymentStatus) {
      case 'paid':
        return { text: 'Paid', icon: <CircleDollarSign className="h-3 w-3" />, className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { text: 'Pending', icon: <Hourglass className="h-3 w-3" />, className: 'bg-amber-100 text-amber-800' };
      case 'na':
      default:
        return { text: 'Free', icon: <Ticket className="h-3 w-3" />, className: 'bg-blue-100 text-blue-800' };
    }
  };
  
  const eventStatus = getEventStatus();
  const paymentStatus = getPaymentStatus();

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden w-full">
      <div className="md:w-1/3 relative h-48 md:h-auto">
        <Image
          src={registration.eventImageUrl || `https://picsum.photos/seed/${registration.eventId}/400/300`}
          alt={registration.eventTitle}
          fill
          className="object-cover"
        />
      </div>
      <div className="md:w-2/3 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg mb-1">{registration.eventTitle}</CardTitle>
            <Badge className={cn('whitespace-nowrap', eventStatus.color, 'text-white')}>{eventStatus.text}</Badge>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {registration.eventDate ? format(new Date(registration.eventDate), 'PPP') : 'Date not set'} at {registration.eventTime}
          </div>
           <div className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {registration.eventLocation}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
           <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={paymentStatus.className}>
                    {paymentStatus.icon}
                    <span className="ml-1.5">{paymentStatus.text}</span>
                </Badge>
                 <Badge variant="outline">
                    {registration.attended ? <Check className="h-3 w-3 mr-1.5 text-green-600" /> : <Clock className="h-3 w-3 mr-1.5" />}
                    {registration.attended ? 'Attended' : 'Not Attended'}
                </Badge>
            </div>
          <p className="text-xs text-muted-foreground">Registered on: {registration.registeredAt?.toDate().toLocaleDateString()}</p>
        </CardContent>
        <CardFooter className="bg-muted/50 p-3 flex justify-end gap-2">
          <QRCodeDialog registration={registration}>
             <Button variant="outline" size="sm"><QrCode className="mr-2 h-4 w-4"/>View QR Code</Button>
          </QRCodeDialog>
          <Button asChild size="sm">
            <Link href={`/student/register/${registration.eventId}`}>View Details</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
