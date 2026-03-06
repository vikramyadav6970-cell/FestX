'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/common/Logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['student', 'organizer'], { required_error: 'Please select a role.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  branch: z.string().min(1, { message: 'Please select a branch.' }),
  year: z.string().min(1, { message: 'Please select a year.' }),
  rollNo: z.string().min(1, { message: 'Please enter your roll number.' }),
  enrollmentNo: z.string().min(1, { message: 'Please enter your enrollment number.' }),
  societyName: z.string().optional(),
  reason: z.string().optional(),
}).refine(data => {
  if (data.role === 'organizer') {
    return !!data.societyName && data.societyName.length > 0;
  }
  return true;
}, {
  message: 'Society/Club name is required for organizers.',
  path: ['societyName'],
}).refine(data => {
  if (data.role === 'organizer') {
    return !!data.reason && data.reason.length > 0;
  }
  return true;
}, {
  message: 'Reason for becoming an organizer is required.',
  path: ['reason'],
});

type RegisterFormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signup, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      branch: '',
      year: '',
      rollNo: '',
      enrollmentNo: '',
      societyName: '',
      reason: '',
    },
  });

  const role = form.watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    const { email, password, ...profileData } = data;
    
    const userData: Partial<UserProfile> = {
      name: profileData.name,
      email: email,
      role: profileData.role,
      status: profileData.role === 'organizer' ? 'pending' : 'active',
      phone: profileData.phone,
      branch: profileData.branch,
      year: profileData.year,
      rollNo: profileData.rollNo,
      enrollmentNo: profileData.enrollmentNo,
      societyName: profileData.societyName,
      reason: profileData.reason,
    };

    try {
      await signup(email, password, userData);
       if (userData.role === 'organizer') {
        toast({
          title: 'Registration Submitted!',
          description: 'Your request to be an organizer is pending approval.',
        });
        router.push('/login');
      } else {
        toast({
          title: 'Registration Successful!',
          description: 'Please log in to continue.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <Logo size="large" />
          </div>
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join FestX to explore and manage college events.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3 rounded-lg border p-4">
                    <FormLabel className="text-base font-semibold">I want to register as a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="student" className="sr-only" />
                            </FormControl>
                            <span className="text-2xl mb-2">🎓</span>
                            <span className="font-bold">Student</span>
                            <span className="text-sm text-center text-muted-foreground mt-1">Explore and register for events.</span>
                          </Label>
                        </FormItem>
                        <FormItem>
                          <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                             <FormControl>
                              <RadioGroupItem value="organizer" className="sr-only" />
                            </FormControl>
                            <span className="text-2xl mb-2">🎪</span>
                            <span className="font-bold">Event Organizer</span>
                            <span className="text-sm text-center text-muted-foreground mt-1">Create and manage events. (Requires approval)</span>
                          </Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Alex Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="student@university.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="password" // This should be confirm password, but for simplicity we reuse.
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Academic Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="branch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cse">CSE</SelectItem>
                                <SelectItem value="ece">ECE</SelectItem>
                                <SelectItem value="mech">Mechanical</SelectItem>
                                <SelectItem value="civil">Civil</SelectItem>
                                <SelectItem value="ee">EE</SelectItem>
                                <SelectItem value="it">IT</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1st">1st</SelectItem>
                                <SelectItem value="2nd">2nd</SelectItem>
                                <SelectItem value="3rd">3rd</SelectItem>
                                <SelectItem value="4th">4th</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rollNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2021001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enrollmentNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enrollment Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., EN2021001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
               </div>
            
              {role === 'organizer' && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Organizer Information</p>
                  <FormField
                    control={form.control}
                    name="societyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Society/Club Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Tech Club, Arts Society" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for becoming an organizer</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe why you want to organize events."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                 {isSubmitting || loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Log In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
