
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (userProfile?.role !== 'admin') {
         // Redirect to their own dashboard if they have a different role
        if (userProfile?.role === 'student') router.push('/student/dashboard');
        else if (userProfile?.role === 'organizer') router.push('/organizer/dashboard');
        else router.push('/unauthorized');
      }
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading || !currentUser || userProfile?.role !== 'admin') {
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
