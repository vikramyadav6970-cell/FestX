
import * as z from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  societyName: z.string().min(1, 'Society/Club name is required.'),
  date: z.date({ required_error: 'Event date is required.' }),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  location: z.string().min(1, 'Venue is required.'),
  otherLocation: z.string().optional(),
  expectedAttendance: z.number().min(1, 'Expected attendance must be at least 1.'),
  
  description: z.string().min(100, 'Description must be at least 100 characters long.'),
  category: z.string().min(1, 'Event category is required.'),
  bannerImage: z
    .any()
    .refine((files) => !files || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => !files || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    )
    .optional(),
  isPaid: z.boolean(),
  entryFee: z.number().optional(),
  paymentQRCode: z
    .any()
    .refine((files) => !files || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => !files || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    )
    .optional(),

  customFields: z.array(z.object({
    label: z.string().min(1, 'Field label is required.'),
    type: z.string(),
    required: z.boolean(),
    options: z.string().optional(),
  })).optional(),
}).refine(data => {
    if (data.location === 'Other') {
        return !!data.otherLocation && data.otherLocation.length > 0;
    }
    return true;
}, {
    message: 'Please specify the venue.',
    path: ['otherLocation'],
}).refine(data => {
    if (data.isPaid) {
        return !!data.entryFee && data.entryFee > 0;
    }
    return true;
}, {
    message: 'Entry fee must be greater than 0 for paid events.',
    path: ['entryFee'],
});
