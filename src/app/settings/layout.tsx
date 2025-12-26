
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SettingsSidebarNav } from '@/components/settings/SettingsSidebarNav';

const sidebarNavItems = [
    {
      title: "Profile",
      href: "/settings",
    },
    {
      title: "Account",
      href: "/settings/account",
    },
    {
      title: "Appearance",
      href: "/settings/appearance",
    },
    {
      title: "Notifications",
      href: "/settings/notifications",
    },
  ]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
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
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                    </p>
                </div>
                 <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <SettingsSidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
