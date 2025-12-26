
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import QRCode from 'react-qr-code';

import { doc, getDoc, addDoc, collection, updateDoc, increment, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Event as EventType } from '@/types';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Calendar, MapPin, Users, Ticket, CircleDollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';


const generateSchema = (fields: EventType['formFields'] = []) => {
  // Ensure fields is an array
  const safeFields = Array.isArray(fields) ? fields : [];

  const schemaObject = safeFields.reduce((acc, field) => {
    if (!field || !field.label) return acc; // Skip invalid field definitions
    
    let fieldSchema;
    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        break;
      case 'checkbox':
        fieldSchema = z.boolean().default(false);
        break;
      default:
        fieldSchema = z.string();
    }
    if (field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = fieldSchema.refine(val => val === true, { message: `${field.label} is required.` });
      } else {
        fieldSchema = (fieldSchema as z.StringSchema).min(1, `${field.label} is required.`);
      }
    } else {
       fieldSchema = fieldSchema.optional().default('');
    }
    acc[field.label] = fieldSchema;
    return acc;
  }, {} as Record<string, z.ZodType<any, any>>);
  
  return z.object(schemaObject);
};


export default function EventRegistrationPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const formSchema = useMemo(() => generateSchema(event?.formFields), [event]);
  
  const defaultValues = useMemo(() => {
    if (!event) return {};
    const safeFields = Array.isArray(event.formFields) ? event.formFields : [];
    return safeFields.reduce((acc, field) => {
      if (field && field.label) {
        acc[field.label] = field.type === 'checkbox' ? false : '';
      }
      return acc;
    }, {} as Record<string, any>) || {};
  }, [event]);

  type FormValues = z.infer<typeof formSchema>;
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Default values will be set via reset
  });
  
  useEffect(() => {
    // Check if event is loaded before resetting form
    if (event) {
      methods.reset(defaultValues);
      setIsFormReady(true);
    }
  }, [event, defaultValues, methods]);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as EventType);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Event not found.' });
          router.push('/student/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load event details.' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, router, toast]);

   useEffect(() => {
    const checkRegistration = async () => {
      if (!currentUser || !eventId) {
        setCheckingStatus(false);
        return;
      }
      setCheckingStatus(true);
      try {
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('eventId', '==', eventId),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(registrationsQuery);
        setIsAlreadyRegistered(!snapshot.empty);
      } catch (error) {
        console.error('Error checking registration status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRegistration();
  }, [currentUser, eventId]);


  const onSubmit = async (data: FormValues) => {
     if (!currentUser || !userProfile || !event) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot process registration.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Final robust check for duplicates right before submission
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', event.id),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(registrationsQuery);

      if (!snapshot.empty) {
        toast({ variant: 'destructive', title: 'Already Registered', description: 'You have already registered for this event.' });
        setIsAlreadyRegistered(true);
        setIsSubmitting(false);
        return;
      }
      
      const qrId = 'FESTX-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
      const registrationData = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.startTime,
        eventLocation: event.location,
        eventImageUrl: event.imageUrl,
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        userPhone: userProfile.phone || '',
        userRollNo: userProfile.rollNo || '',
        userBranch: userProfile.branch || '',
        userYear: userProfile.year || '',
        formResponses: data,
        paymentStatus: event.isPaid ? 'pending' : 'na',
        qrCode: qrId,
        attended: false,
        attendedAt: null,
        registeredAt: serverTimestamp(),
      };
      
      const registrationsRef = collection(db, 'registrations');
      await addDoc(registrationsRef, registrationData);

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        registrationCount: increment(1),
      });

      setQrCodeValue(qrId);
      setRegistrationSuccess(true);
      toast({ title: 'Registration Successful!', description: 'Your QR code is ready.' });

    } catch (error) {
        console.error("Registration failed:", error);
        toast({ variant: 'destructive', title: 'Registration Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-48 w-full" />
    </div>;
  }

  if (!event) {
    return <p className="text-center">Event not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Image src={event.imageUrl || 'https://picsum.photos/seed/event/1200/400'} alt={event.title} width={1200} height={400} className="w-full h-64 object-cover rounded-lg" />
        <div className="mt-4 space-y-6">
            <h1 className="font-headline text-4xl font-bold text-foreground">{event.title}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(event.date).toLocaleDateString()} at {event.startTime}</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Organized by {event.organizer}</span>
            </div>
            <p>{event.description}</p>
        </div>

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Registration Form</CardTitle>
                <CardDescription>Fill out your details to register for this event.</CardDescription>
            </CardHeader>
            <CardContent>
                {checkingStatus ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : isAlreadyRegistered ? (
                     <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 dark:text-green-300">You are already registered!</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            You can find your QR code ticket in the 'My QR Codes' section of your dashboard.
                             <Button asChild variant="link" className="px-0 h-auto">
                                <Link href="/student/my-qrcodes">View My QR Codes</Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : isFormReady ? (
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                            <div className="space-y-1">
                                <FormLabel>Name</FormLabel>
                                <Input value={userProfile?.name || ''} disabled />
                            </div>
                            <div className="space-y-1">
                                <FormLabel>Email</FormLabel>
                                <Input value={userProfile?.email || ''} disabled />
                            </div>
                            <div className="space-y-1">
                                <FormLabel>Phone</FormLabel>
                                <Input value={userProfile?.phone || ''} disabled />
                            </div>
                                <div className="space-y-1">
                                <FormLabel>Roll No.</FormLabel>
                                <Input value={userProfile?.rollNo || ''} disabled />
                            </div>
                        </div>
                            
                            {Array.isArray(event.formFields) && event.formFields.length > 0 && (
                              <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                                {event.formFields.map(field => (
                                    <FormField
                                        key={field.label}
                                        control={methods.control}
                                        name={field.label as keyof FormValues}
                                        render={({ field: formField }) => (
                                            <FormItem>
                                                <FormLabel>{field.label}{field.required && '*'}</FormLabel>
                                                <FormControl>
                                                    {field.type === 'textarea' ? (
                                                        <Textarea placeholder={`Your ${field.label}`} {...formField as any} />
                                                    ) : (
                                                        <Input placeholder={`Your ${field.label}`} {...formField as any} />
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                              </div>
                            )}

                            {event.isPaid && (
                                <Alert>
                                    <CircleDollarSign className="h-4 w-4" />
                                    <AlertTitle>This is a paid event</AlertTitle>
                                    <AlertDescription>
                                        Please pay ₹{event.amount} using the QR code provided and enter the transaction details below.
                                        <Image src={event.paymentQRUrl || 'https://picsum.photos/seed/qr/200/200'} alt="Payment QR Code" width={200} height={200} className="mt-4 rounded-md" />
                                    </AlertDescription>
                                </Alert>
                            )}

                        <Button type="submit" disabled={isSubmitting || isAlreadyRegistered} className="w-full">
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : 'Register Now'}
                        </Button>
                        </form>
                    </FormProvider>
                ) : (
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
            </CardContent>
        </Card>

      <Dialog open={registrationSuccess} onOpenChange={(open) => {
          if (!open) {
              setRegistrationSuccess(false);
              // Re-check status in case user re-opens
              setIsAlreadyRegistered(true);
          }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registration Successful!</DialogTitle>
            <DialogDescription>
              Here is your unique QR code for the event. You can also find it on the 'My QR Codes' page.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex items-center justify-center bg-white p-4">
            {qrCodeValue && <QRCode value={qrCodeValue} size={256} />}
          </div>
          <DialogFooter>
             <Button asChild className="w-full">
              <Link href="/student/my-registrations">View My Registrations</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
