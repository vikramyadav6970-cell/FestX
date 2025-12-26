'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';

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
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/common/Logo';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, userProfile, loading: authLoading, error: authError } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      if (userProfile.role === 'student') {
        router.push('/student/dashboard');
      } else if (userProfile.role === 'organizer') {
        // Organizer layout handles pending status, just push to dashboard
        router.push('/organizer/dashboard');
      } else if (userProfile.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [currentUser, userProfile, authLoading, router]);


  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await login(data.email, data.password);
      toast({
        title: "Login Successful!",
        description: "Redirecting to your dashboard...",
      });
      // The useEffect will handle the redirection
    } catch (e: any) {
      const errorMessage = e.code?.includes('auth/invalid-credential') 
        ? 'Invalid email or password.'
        : e.message || 'An unexpected error occurred.';
      setSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent_40%)]"></div>
        <div className="z-10 text-center">
            <Link href="/" className="flex items-center justify-center gap-4 mb-8">
              <Logo size="large" className="text-white" />
            </Link>
            <p className="font-headline text-2xl mt-4">Unified College Event & Resource Management System</p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4 sm:p-8 bg-background">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {authError?.includes('pending approval') && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Pending Approval</AlertTitle>
                <AlertDescription>
                  Your organizer account is pending approval. Please wait for an admin to approve your request.
                </AlertDescription>
              </Alert>
            )}
             {submissionError && !authError?.includes('pending approval') && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="student@university.edu" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Remember me
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                  {isSubmitting || authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    'Log In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
