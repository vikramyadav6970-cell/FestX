'use client';

import type { OrganizerApprovalRequest } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, GraduationCap, Building, Info } from 'lucide-react';
import { ApprovalActions } from './ApprovalActions';

interface OrganizerRequestCardProps {
  request: OrganizerApprovalRequest;
}

export function OrganizerRequestCard({ request }: OrganizerRequestCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-xl">
              {request.requesterName}
            </CardTitle>
            <CardDescription>{request.requesterEmail}</CardDescription>
          </div>
          <Badge variant="outline">{request.societyName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{request.requesterEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{request.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>
              {request.branch || 'N/A'}, {request.year || 'N/A'} Year
            </span>
          </div>
           <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{request.societyName}</span>
          </div>
        </div>
        <div className="space-y-1 rounded-md border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Reason for joining</p>
            <p className="text-sm">{request.reason}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Requested on:{' '}
            {request.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}
          </div>
          <ApprovalActions
            requestType="organizer"
            requestId={request.id}
            targetUserId={request.requesterId}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
