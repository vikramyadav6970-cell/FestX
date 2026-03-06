
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Send, Users, Calendar, Bell } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Event as EventType } from '@/types';

export default function SendNotificationPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all-my-attendees'); // 'all-my-attendees', 'event'
  const [targetEventId, setTargetEventId] = useState('');

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!currentUser?.uid) return;

      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizerId', '==', currentUser.uid),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventType[];
        setEvents(eventsData);
      } catch (err) {
        console.error('Error fetching events:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch your events.',
        });
      }
    };
    fetchMyEvents();
  }, [currentUser, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all fields.',
      });
      return;
    }
    if (targetType === 'event' && !targetEventId) {
      toast({
        variant: 'destructive',
        title: 'Missing Event',
        description: 'Please select an event.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let targetEventTitle = '';
      if (targetType === 'event' && targetEventId) {
        const targetEvent = events.find((e) => e.id === targetEventId);
        targetEventTitle = targetEvent?.title || '';
      }

      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        targetType,
        targetEventId: targetEventId || null,
        targetEventTitle,
        senderId: currentUser?.uid,
        senderName: userProfile?.name || 'Organizer',
        senderRole: 'organizer',
        readBy: [],
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Notification Sent!',
        description: 'Your message has been successfully sent.',
      });

      setTitle('');
      setMessage('');
      setTargetType('all-my-attendees');
      setTargetEventId('');
    } catch (err) {
      console.error('Error sending notification:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send notification. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Send Notification
        </h1>
        <p className="text-muted-foreground">
          Broadcast messages to your event attendees.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
          <CardDescription>
            Select your audience and write your message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium">
                Target Audience
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('all-my-attendees');
                    setTargetEventId('');
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center',
                    targetType === 'all-my-attendees'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Users
                    className={cn(
                      'mb-2 h-6 w-6',
                      targetType === 'all-my-attendees'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                  <p
                    className={cn(
                      'text-sm font-medium',
                      targetType === 'all-my-attendees'
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    All My Attendees
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Send to users registered in any of your events.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('event')}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center',
                    targetType === 'event'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Calendar
                    className={cn(
                      'mb-2 h-6 w-6',
                      targetType === 'event'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                  <p
                    className={cn(
                      'text-sm font-medium',
                      targetType === 'event' ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    Event Specific
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Send to users registered for one specific event.
                  </p>
                </button>
              </div>
            </div>

            {targetType === 'event' && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Event
                </label>
                <Select
                  value={targetEventId}
                  onValueChange={setTargetEventId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Notification Title
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Event Time Change"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message here..."
                rows={5}
                maxLength={500}
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {message.length}/500 characters
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
