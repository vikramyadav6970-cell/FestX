'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ApprovalActionsProps {
  requestId: string;
  requestType: 'organizer' | 'event';
  targetUserId?: string; // For organizer requests
  targetEventId?: string; // For event requests
}

export function ApprovalActions({
  requestId,
  requestType,
  targetUserId,
  targetEventId,
}: ApprovalActionsProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Unauthorized' });
      return;
    }
    setIsApproving(true);
    setIsSubmitting(true);

    try {
      if (requestType === 'organizer' && targetUserId) {
        // Update approval request
        const approvalDocRef = doc(db, 'approvalRequests', requestId);
        await updateDoc(approvalDocRef, {
          status: 'approved',
          reviewedBy: userProfile.uid,
          reviewedAt: serverTimestamp(),
        });
        // Update user status
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, {
          status: 'active',
        });
      } else if (requestType === 'event' && targetEventId) {
        const eventDocRef = doc(db, 'events', targetEventId);
        await updateDoc(eventDocRef, {
          status: 'approved',
        });
      }

      toast({
        title: 'Request Approved',
        description: `The ${requestType} request has been successfully approved.`,
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve the request.',
      });
    } finally {
      setIsApproving(false);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Unauthorized' });
      return;
    }
    if (!rejectionReason) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
      });
      return;
    }
    setIsRejecting(true);
    setIsSubmitting(true);

    try {
      if (requestType === 'organizer' && targetUserId) {
        // Update approval request
        const approvalDocRef = doc(db, 'approvalRequests', requestId);
        await updateDoc(approvalDocRef, {
          status: 'rejected',
          remarks: rejectionReason,
          reviewedBy: userProfile.uid,
          reviewedAt: serverTimestamp(),
        });
        // Update user status
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, {
          status: 'rejected',
        });
      } else if (requestType === 'event' && targetEventId) {
        const eventDocRef = doc(db, 'events', targetEventId);
        await updateDoc(eventDocRef, {
          status: 'rejected',
          rejectionReason: rejectionReason,
        });
      }

      toast({
        title: 'Request Rejected',
        description: `The ${requestType} request has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject the request.',
      });
    } finally {
      setIsRejecting(false);
      setIsSubmitting(false);
      setRejectionReason('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
        onClick={handleApprove}
        disabled={isSubmitting}
      >
        {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={isSubmitting}
          >
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reason for Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this request. This will be
              visible to the requester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Type your reason here."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason || isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
