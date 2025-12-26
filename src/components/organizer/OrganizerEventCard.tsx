
'use client';
import type { Event } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Edit, Trash2, BarChart, Bell, UserPlus, CircleDollarSign, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface OrganizerEventCardProps {
  event: Event;
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function OrganizerEventCard({ event }: OrganizerEventCardProps) {
  const isCompleted = new Date(event.date) < new Date() && event.status === 'approved';
  const displayStatus = isCompleted ? 'completed' : event.status;

  const renderActions = () => {
    if (event.hasConflict) {
        return <Button asChild size="sm" variant="destructive"><Link href={`/organizer/reschedule/${event.id}`}><RefreshCw className="mr-2 h-4 w-4"/>Reschedule</Link></Button>
    }
    switch(displayStatus) {
      case 'pending':
        return (
            <>
                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Cancel</Button>
            </>
        );
      case 'approved':
         return <Button asChild size="sm"><Link href={`/organizer/event/${event.id}/registrations`}>Manage Event</Link></Button>
      case 'rejected':
         return <Button asChild variant="outline" size="sm"><Link href={`/organizer/reschedule/${event.id}`}><RefreshCw className="mr-2 h-4 w-4"/>Edit & Resubmit</Link></Button>
      case 'completed':
          return <Button variant="outline" size="sm"><BarChart className="mr-2 h-4 w-4"/>View Report</Button>
      default:
        return null;
    }
  }

  const renderMenu = () => (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
             {displayStatus === 'approved' && (
                <>
                    <DropdownMenuItem asChild><Link href={`/organizer/event/${event.id}/registrations`}><Users className="mr-2 h-4 w-4" />Registrations</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href={`/organizer/reschedule/${event.id}`}><RefreshCw className="mr-2 h-4 w-4"/>Reschedule</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href={`/organizer/event/${event.id}/volunteers`}><UserPlus className="mr-2 h-4 w-4" />Volunteers</Link></DropdownMenuItem>
                    {event.isPaid && <DropdownMenuItem asChild><Link href={`/organizer/event/${event.id}/budget`}><CircleDollarSign className="mr-2 h-4 w-4" />Budget</Link></DropdownMenuItem>}
                    <DropdownMenuItem><Bell className="mr-2 h-4 w-4"/>Send Notification</DropdownMenuItem>
                </>
             )}
             {displayStatus === 'rejected' && event.rejectionReason && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                                <Eye className="mr-2 h-4 w-4"/>View Rejection Reason
                            </DropdownMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                            <p>{event.rejectionReason}</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
             )}
        </DropdownMenuContent>
     </DropdownMenu>
  )

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="relative h-40 w-full p-0">
        <Image
          src={event.imageUrl || 'https://picsum.photos/seed/event/600/400'}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
            {event.hasConflict && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Badge variant="destructive" className="animate-pulse"><AlertTriangle className="h-3 w-3 mr-1"/> Conflict</Badge>
                        </TooltipTrigger>
                        <TooltipContent><p>{event.conflictReason || "This event conflicts with an official event."}</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            )}
            <Badge variant="outline" className={cn("capitalize", statusStyles[displayStatus])}>
                {displayStatus}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-4">
        <CardTitle className="font-headline text-lg leading-tight">{event.title}</CardTitle>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })} @ {event.startTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>{event.registrationCount || 0} Registrations</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-3 flex justify-between items-center">
        <div className="flex gap-2">
            {renderActions()}
        </div>
        {renderMenu()}
      </CardFooter>
    </Card>
  );
}
