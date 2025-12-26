
'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import type { EventFormValues } from '@/app/organizer/create-event/page';

const defaultFields = [
  { label: 'Name', type: 'text', required: true, default: true },
  { label: 'Email', type: 'email', required: true, default: true },
  { label: 'Phone', type: 'tel', required: true, default: true },
  { label: 'Roll No', type: 'text', required: true, default: true },
];

export function CreateEventStep3() {
  const { control } = useFormContext<EventFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Form Builder</CardTitle>
        <CardDescription>
          Customize the form for your event attendees. Default fields are
          included automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-4 font-medium text-muted-foreground">Default Fields</h3>
          <div className="space-y-4">
            {defaultFields.map((field) => (
              <div
                key={field.label}
                className="flex items-center gap-4 rounded-md border bg-muted/50 p-4"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <Input value={field.label} disabled className="flex-1" />
                <Input value={field.type} disabled className="w-32" />
                <div className="flex items-center gap-2">
                  <Switch checked={field.required} disabled />
                  <FormLabel>Required</FormLabel>
                </div>
                <Button variant="ghost" size="icon" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-medium text-muted-foreground">Custom Fields</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-4 rounded-md border p-4"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                
                <FormField
                  control={control}
                  name={`customFields.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Field Label" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`customFields.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`customFields.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                       <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl>
                      <FormLabel>Required</FormLabel>
                    </FormItem>
                  )}
                />

                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ label: '', type: 'text', required: false, options: '' })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Custom Field
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

