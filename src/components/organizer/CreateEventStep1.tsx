
'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { EventFormValues } from '@/app/organizer/create-event/page';

const venues = [
  'Main Auditorium',
  'Seminar Hall A',
  'Seminar Hall B',
  'Open Ground',
  'Computer Lab',
  'Conference Room',
  'Other',
];

export function CreateEventStep1() {
  const { control, watch } = useFormContext<EventFormValues>();
  const location = watch('location');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., InnovateTech 2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="societyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Society/Club Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tech Club" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Event Date*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time*</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time*</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue} value={venue}>
                        {venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {location === 'Other' && (
            <FormField
              control={control}
              name="otherLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please specify venue*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Library Rooftop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={control}
          name="expectedAttendance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Attendance*</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
