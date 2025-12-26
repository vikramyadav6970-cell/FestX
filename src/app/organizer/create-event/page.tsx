
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/firebase/config';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateEventStep1 } from '@/components/organizer/CreateEventStep1';
import { CreateEventStep2 } from '@/components/organizer/CreateEventStep2';
import { CreateEventStep3 } from '@/components/organizer/CreateEventStep3';
import { CreateEventStep4 } from '@/components/organizer/CreateEventStep4';
import { eventSchema } from '@/lib/schemas';
import type { Event as EventType } from '@/types';

export type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('step1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venueConflict, setVenueConflict] = useState<{ exists: boolean, event?: EventType } | null>(null);
  const [checkingVenue, setCheckingVenue] = useState(false);


  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      societyName: userProfile?.societyName || '',
      date: undefined,
      startTime: '',
      endTime: '',
      location: '',
      otherLocation: '',
      expectedAttendance: 0,
      description: '',
      category: '',
      bannerImage: undefined,
      isPaid: false,
      entryFee: 0,
      paymentQRCode: undefined,
      customFields: [],
    },
    mode: 'onChange',
  });

  const { trigger, getValues, watch } = methods;

  const watchedLocation = watch('location');
  const watchedOtherLocation = watch('otherLocation');
  const watchedDate = watch('date');
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');

  const checkVenueAvailability = async (location: string, date: Date, startTime: string, endTime: string) => {
    const venue = location === 'Other' ? getValues('otherLocation') : location;
    if (!venue || !date || !startTime || !endTime) {
      setVenueConflict(null);
      return;
    }

    try {
      setCheckingVenue(true);
      
      const eventsQuery = query(
        collection(db, 'events'),
        where('location', '==', venue),
        where('status', '==', 'approved')
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventType[];

      const selectedDate = new Date(date).toDateString();
      
      const conflictingEvent = events.find(event => {
        const eventDate = new Date(event.date);
        const eventDateStr = eventDate.toDateString();
        
        if (eventDateStr !== selectedDate) return false;
        
        const eventStart = event.startTime;
        const eventEnd = event.endTime;
        
        const hasOverlap = !(endTime <= eventStart || startTime >= eventEnd);
        
        return hasOverlap;
      });

      if (conflictingEvent) {
        setVenueConflict({
          exists: true,
          event: conflictingEvent
        });
      } else {
        setVenueConflict({
          exists: false
        });
      }

    } catch (error) {
      console.error('Error checking venue:', error);
      setVenueConflict(null);
    } finally {
      setCheckingVenue(false);
    }
  };

  useEffect(() => {
    const venue = watchedLocation === 'Other' ? watchedOtherLocation : watchedLocation;
    checkVenueAvailability(venue, watchedDate, watchedStartTime, watchedEndTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLocation, watchedOtherLocation, watchedDate, watchedStartTime, watchedEndTime]);

  const handleTabChange = async (newTab: string) => {
    let isValid = true;
    if (currentTab === 'step1') {
      isValid = await trigger(['title', 'societyName', 'date', 'startTime', 'endTime', 'location', 'expectedAttendance']);
    } else if (currentTab === 'step2') {
      isValid = await trigger(['description', 'category']);
    }
    
    if (isValid) {
       if (venueConflict?.exists) {
         toast({
          variant: 'destructive',
          title: 'Venue Conflict',
          description: 'Please resolve the venue conflict before proceeding.',
        });
        return;
      }
      setCurrentTab(newTab);
    } else {
       toast({
        variant: 'destructive',
        title: 'Incomplete Step',
        description: 'Please fill out all required fields before proceeding.',
      });
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const onSubmit = async (data: EventFormValues) => {
    if (venueConflict?.exists) {
        toast({
            variant: 'destructive',
            title: 'Cannot Submit',
            description: 'Please resolve the venue conflict before submitting.',
        });
        return;
    }

    setIsSubmitting(true);
    if (!currentUser || !userProfile) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create an event.' });
      setIsSubmitting(false);
      return;
    }

    try {
      let bannerUrl = '';
      if (data.bannerImage && data.bannerImage[0]) {
        bannerUrl = await uploadFile(data.bannerImage[0], `event-banners/${currentUser.uid}-${Date.now()}`);
      }

      let paymentQRUrl = '';
      if (data.isPaid && data.paymentQRCode && data.paymentQRCode[0]) {
        paymentQRUrl = await uploadFile(data.paymentQRCode[0], `payment-qrs/${currentUser.uid}-${Date.now()}`);
      }
      
      const eventDate = new Date(data.date);
      const [startHour, startMinute] = data.startTime.split(':');
      eventDate.setHours(parseInt(startHour), parseInt(startMinute));

      // Sanitize formFields before saving
      const sanitizedFormFields = data.customFields && data.customFields.length > 0
        ? data.customFields.map(field => ({
            label: field.label || '',
            type: field.type || 'text',
            required: Boolean(field.required),
            options: field.options || '',
          }))
        : [];

      const eventDoc = {
        title: data.title,
        description: data.description,
        societyName: data.societyName,
        location: data.location === 'Other' ? data.otherLocation : data.location,
        date: eventDate.toISOString(),
        startTime: data.startTime,
        endTime: data.endTime,
        category: data.category,
        expectedAttendance: data.expectedAttendance,
        isPaid: data.isPaid,
        amount: data.entryFee,
        paymentQRUrl,
        imageUrl: bannerUrl,
        imageHint: 'custom event',
        organizerId: currentUser.uid,
        organizer: userProfile.name,
        organizerEmail: userProfile.email,
        status: 'pending' as const,
        formFields: sanitizedFormFields,
        registrationCount: 0,
        createdAt: serverTimestamp(),
      };
      
      const eventCollectionRef = collection(db, 'events');
      await addDoc(eventCollectionRef, eventDoc);

      toast({
        title: 'Event Submitted!',
        description: 'Your event has been submitted for approval.',
      });
      router.push('/organizer/my-events');

    } catch (error: any) {
      console.error('Event creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Create New Event
        </h1>
        <p className="text-muted-foreground">
          Fill out the details below to bring your event to life.
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">Details</TabsTrigger>
              <TabsTrigger value="step2">Description</TabsTrigger>
              <TabsTrigger value="step3">Form</TabsTrigger>
              <TabsTrigger value="step4">Review</TabsTrigger>
            </TabsList>
            
            <TabsContent value="step1" className="mt-6">
              <CreateEventStep1 />
              <div className="mt-4 space-y-4">
                {checkingVenue && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking venue availability...
                  </div>
                )}
                {venueConflict?.exists && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">
                        Venue Not Available
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        "{venueConflict.event?.title}" is already scheduled at this venue on this date from {venueConflict.event?.startTime} to {venueConflict.event?.endTime}.
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Please select a different venue, date, or time slot.
                      </p>
                    </div>
                  </div>
                )}
                {venueConflict && !venueConflict.exists && getValues('location') && getValues('date') && getValues('startTime') && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Venue is available for the selected date and time!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="step2" className="mt-6">
              <CreateEventStep2 />
            </TabsContent>
            <TabsContent value="step3" className="mt-6">
              <CreateEventStep3 />
            </TabsContent>
            <TabsContent value="step4" className="mt-6">
              <CreateEventStep4 eventData={getValues()} />
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleTabChange(`step${parseInt(currentTab.slice(-1)) - 1}`)}
              disabled={currentTab === 'step1'}
            >
              Back
            </Button>
            
            {currentTab !== 'step4' ? (
              <Button type="button" onClick={() => handleTabChange(`step${parseInt(currentTab.slice(-1)) + 1}`)}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || venueConflict?.exists}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Approval'
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
