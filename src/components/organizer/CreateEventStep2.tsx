
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { EventFormValues } from '@/app/organizer/create-event/page';

const categories = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

export function CreateEventStep2() {
  const { control, watch } = useFormContext<EventFormValues>();
  const isPaid = watch('isPaid');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us more about your event..."
                  className="resize-none h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Category*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="bannerImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Banner Image</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4 rounded-md border p-4">
          <FormField
            control={control}
            name="isPaid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Is this a paid event?</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          {isPaid && (
            <div className="space-y-4">
              <FormField
                control={control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (INR)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="paymentQRCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment QR Code Image</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
