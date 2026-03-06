
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Registration } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode as QrCodeIcon, Download } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { QRCodeCard } from '@/components/student/QRCodeCard';
import { Button } from '@/components/ui/button';
import { QRCodeDialog } from '@/components/student/QRCodeDialog';

export default function MyQRCodesPage() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<Registration | null>(null);

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

      // Sort by registration date (newest first)
      fetchedRegistrations.sort((a, b) => {
        const dateA = a.registeredAt?.toDate ? a.registeredAt.toDate() : new Date(0);
        const dateB = b.registeredAt?.toDate ? b.registeredAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRegistrations(fetchedRegistrations);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const validRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const eventDate = new Date(r.eventDate);
      return (isToday(eventDate) || !isPast(eventDate)) && !r.attended;
    });
  }, [registrations]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          My QR Codes
        </h1>
        <p className="text-muted-foreground">
          Your personal tickets for event check-in.
        </p>
      </div>

       {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton key={i} className="aspect-square w-full" />
              <Skeleton key={`t-${i}`} className="h-5 w-3/4" />
              <Skeleton key={`d-${i}`} className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <QrCodeIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No QR Codes Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Register for an event to get your QR code ticket.
          </p>
          <Button asChild className="mt-6">
            <Link href="/student/events">Browse Events</Link>
          </Button>
        </div>
      ) : validRegistrations.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <QrCodeIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Valid QR Codes</h3>
            <p className="mt-2 text-sm text-muted-foreground">
            All your event QR codes are either used or have expired.
            </p>
            <Button asChild className="mt-6">
            <Link href="/student/events">Find New Events</Link>
            </Button>
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {validRegistrations.map(reg => (
             <QRCodeDialog key={reg.id} registration={reg}>
                <QRCodeCard registration={reg} />
            </QRCodeDialog>
            ))}
        </div>
      )}
    </div>
  );
}
