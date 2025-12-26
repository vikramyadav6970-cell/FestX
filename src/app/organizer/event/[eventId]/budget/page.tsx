'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import type { Event as EventType, Budget, Registration } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BudgetSummary } from '@/components/organizer/budget/BudgetSummary';
import { IncomeTable } from '@/components/organizer/budget/IncomeTable';
import { ExpensesTable } from '@/components/organizer/budget/ExpensesTable';

export default function BudgetManagerPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { currentUser } = useAuth();

  const [event, setEvent] = useState<EventType | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !currentUser) return;

    setLoading(true);
    const eventRef = doc(db, 'events', eventId);

    const unsubEvent = onSnapshot(eventRef, (doc) => {
      if (doc.exists()) {
        const eventData = { id: doc.id, ...doc.data() } as EventType;
        if (eventData.organizerId !== currentUser.uid) {
            setEvent(null);
             setLoading(false);
            return;
        }
        setEvent(eventData);
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    return () => {
      unsubEvent();
    };
  }, [eventId, currentUser]);

  useEffect(() => {
    if (!event) return;

    const budgetRef = doc(db, 'budgets', eventId);

    const unsubBudget = onSnapshot(budgetRef, async (doc) => {
        if (doc.exists()) {
            setBudget({ id: doc.id, ...doc.data() } as Budget);
        } else {
             const expectedIncome = (event.registrationCount || 0) * (event.amount || 0);
             const budgetShell: Budget = {
                id: eventId,
                eventId: eventId,
                expectedIncome: expectedIncome,
                collectedIncome: 0,
                verifiedPayments: 0,
                totalExpenses: 0,
                expenses: [],
             }
             setBudget(budgetShell);
        }
    });
    
    const regsCollection = collection(db, 'registrations');
    const q = query(regsCollection, where('eventId', '==', eventId));
    const unsubRegistrations = onSnapshot(q, (snapshot) => {
         const regs = snapshot.docs.map(d => ({id: d.id, ...d.data()})) as Registration[];
         setRegistrations(regs);
    });


    return () => {
        unsubBudget();
        unsubRegistrations();
    }
  }, [event, eventId]);


  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
     return (
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Event Not Found
        </h1>
        <p className="text-muted-foreground">
          The event you are looking for does not exist or you do not have permission to view it.
        </p>
      </div>
    );
  }

  if (!event.isPaid) {
    return (
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Budget Manager
        </h1>
        <p className="text-muted-foreground">
          This feature is only available for paid events. This event is marked as free.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Budget Manager: {event.title}
        </h1>
        <div className="flex items-center gap-4 text-muted-foreground">
            <span>{new Date(event.date).toLocaleDateString()}</span>
            <Badge variant="outline">{event.status}</Badge>
        </div>
      </div>
      
      {budget && <BudgetSummary budget={budget} event={event} />}
      
      {event && <IncomeTable registrations={registrations} budgetId={budget?.id || eventId} event={event} />}

      {budget && <ExpensesTable budget={budget} />}

    </div>
  );
}
