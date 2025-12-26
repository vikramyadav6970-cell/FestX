
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Calendar,
  Ticket,
  Bell,
  LogOut,
  Settings,
  Shield,
  Users,
  UserCheck,
  CalendarDays,
  BellRing,
  PlusCircle,
  LayoutDashboard,
  QrCode,
  User,
  Send,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";

const navItems = {
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: Home },
    { href: "/student/events", label: "Events", icon: Calendar },
    { href: "/student/my-registrations", label: "My Registrations", icon: Ticket },
    { href: "/student/notifications", label: "Notifications", icon: Bell },
    { href: "/student/my-qrcodes", label: "My QR Codes", icon: QrCode },
  ],
  organizer: [
    { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/create-event", label: "Create Event", icon: PlusCircle },
    { href: "/organizer/my-events", label: "My Events", icon: Calendar },
    { href: "/organizer/notifications", label: "Notifications", icon: Bell },
    { href: "/organizer/send-notification", label: "Send Message", icon: Send },
    { href: "/organizer/scanner", label: "QR Scanner", icon: QrCode },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Shield },
    { href: "/admin/create-event", label: "Create Event", icon: PlusCircle },
    { href: "/admin/approvals", label: "Approvals", icon: UserCheck },
    { href: "/admin/events", label: "All Events", icon: CalendarDays },
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/notifications", label: "Send Alerts", icon: BellRing },
  ],
};


export function DashboardSidebar() {
  const pathname = usePathname();
  const { userProfile, logout, currentUser } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const currentNavItems = userProfile ? navItems[userProfile.role] : [];
  
  const isActive = (href: string) => pathname.startsWith(href) && (href !== '/student/dashboard' && href !== '/organizer/dashboard' && href !== '/admin/dashboard' || pathname === href);

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" isActive={pathname.startsWith('/settings')}>
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} asChild tooltip="Logout">
                <Link href="/login">
                  <LogOut />
                  <span>Logout</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-2"/>
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarImage src={`https://picsum.photos/seed/${currentUser?.uid}/40/40`} />
            <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate font-semibold text-sm">{userProfile?.name}</span>
            <span className="truncate text-xs text-muted-foreground">{userProfile?.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}
