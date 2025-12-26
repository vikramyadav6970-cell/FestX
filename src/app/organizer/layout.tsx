
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (userProfile?.role !== 'organizer') {
        // Redirect to their own dashboard if they have a different role
        if (userProfile?.role === 'student') router.push('/student/dashboard');
        else if (userProfile?.role === 'admin') router.push('/admin/dashboard');
        else router.push('/unauthorized');
      }
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userProfile?.role === 'organizer' && userProfile.status === 'pending') {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your organizer account is still awaiting approval from an administrator.
              You will be able to access the organizer dashboard once your account is activated.
              <Button onClick={() => { logout(); router.push('/login'); }} className="mt-4 w-full">
                Logout and Return to Login
              </Button>
            </AlertDescription>
          </Alert>
       </div>
     );
  }
  
  if (userProfile?.role !== 'organizer') {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardSidebar />
      </Sidebar>
      <SidebarInset className="bg-background">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
