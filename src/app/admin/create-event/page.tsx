
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  Loader2,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const venues = [
  'Main Auditorium',
  'Seminar Hall A',
  'Seminar Hall B',
  'Conference Room',
  'Open Ground',
  'Sports Complex',
  'Computer Lab 1',
  'Library Hall',
];

const AdminCreateEventPage = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    societyName: 'Administration',
    category: 'Official',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    expectedAttendance: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
        ...prev,
        [name]: value
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.startTime || !formData.venue) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill all required fields.',
      });
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        societyName: formData.societyName,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime || '',
        location: formData.venue,
        expectedAttendance: parseInt(formData.expectedAttendance) || 0,
        isPaid: false,
        amount: 0,
        priority: 'high',
        createdByAdmin: true,
        organizerId: currentUser?.uid,
        organizer: userProfile?.name || 'Admin',
        organizerEmail: userProfile?.email || '',
        status: 'approved' as const,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid,
        formFields: [],
        registrationCount: 0,
        createdAt: serverTimestamp(),
        imageUrl: `https://picsum.photos/seed/${Math.random()}/1200/400`,
        imageHint: 'official event',
      };

      await addDoc(collection(db, 'events'), eventData);
      toast({
        title: 'Event Created Successfully!',
        description: `${formData.title} has been published.`,
      });
      router.push('/admin/events');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create event: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/admin/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
            Create Official Event
          </h1>
          <p className="text-muted-foreground">
            Admin events have highest priority and are auto-approved.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill in the basic information for your official event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Event description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue *</label>
                <Select name="venue" value={formData.venue} onValueChange={(v) => handleSelectChange('venue', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Attendance</label>
                <Input
                  type="number"
                  name="expectedAttendance"
                  value={formData.expectedAttendance}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/admin/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AdminCreateEventPage;
