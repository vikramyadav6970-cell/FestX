'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Registration, Budget, Event as EventType } from '@/types';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

interface IncomeTableProps {
  registrations: Registration[];
  budgetId: string;
  event: EventType;
}

export function IncomeTable({ registrations, budgetId, event }: IncomeTableProps) {
  const { toast } = useToast();

  const handleVerifyPayment = async (registration: Registration) => {
    if (!registration.id || registration.paymentStatus !== 'pending') return;

    const batch = writeBatch(db);
    const budgetRef = doc(db, 'budgets', budgetId);
    
    try {
      const budgetSnap = await getDoc(budgetRef);
      if (!budgetSnap.exists()) {
        throw new Error("Budget document not found!");
      }
      const currentBudget = budgetSnap.data() as Budget;

      const regRef = doc(db, 'registrations', registration.id);
      batch.update(regRef, { paymentStatus: 'paid' });

      const newCollectedIncome = (currentBudget.collectedIncome || 0) + (event.amount || 0);
      const newVerifiedPayments = (currentBudget.verifiedPayments || 0) + 1;

      batch.update(budgetRef, { 
          collectedIncome: newCollectedIncome,
          verifiedPayments: newVerifiedPayments
       });

      await batch.commit();
      toast({ title: 'Payment Verified', description: `${registration.userName}'s payment has been marked as paid.` });
    } catch (error: any) {
      console.error('Failed to verify payment:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to verify payment.' });
    }
  };

  const pendingRegistrations = registrations.filter(r => r.paymentStatus === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Verification</CardTitle>
        <CardDescription>
          Verify pending payments from attendees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Registered At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingRegistrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No pending payments to verify.
                </TableCell>
              </TableRow>
            )}
            {pendingRegistrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell>{reg.userName}</TableCell>
                <TableCell>{reg.userRollNo}</TableCell>
                <TableCell>{reg.registeredAt?.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={reg.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {reg.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {reg.paymentStatus === 'pending' && (
                    <Button size="sm" onClick={() => handleVerifyPayment(reg)}>
                      <Check className="mr-2 h-4 w-4" />
                      Verify
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
