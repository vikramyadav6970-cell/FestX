'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import type { Budget, Expense } from '@/types';
import { AddExpenseDialog } from './AddExpenseDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';

interface ExpensesTableProps {
  budget: Budget;
}

export function ExpensesTable({ budget }: ExpensesTableProps) {
  const { toast } = useToast();

  const handleDeleteExpense = async (expenseToDelete: Expense) => {
    const budgetRef = doc(db, 'budgets', budget.id);
    try {
      await updateDoc(budgetRef, {
        expenses: arrayRemove(expenseToDelete),
        totalExpenses: (budget.totalExpenses || 0) - expenseToDelete.amount,
      });
      toast({ title: 'Expense Deleted' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error deleting expense' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
            Track all expenses for this event.
            </CardDescription>
        </div>
        <AddExpenseDialog budget={budget}>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
            </Button>
        </AddExpenseDialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budget.expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses added yet.
                </TableCell>
              </TableRow>
            )}
            {budget.expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.description}</TableCell>
                <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                <TableCell>₹{expense.amount}</TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {/* Edit functionality can be added here */}
                      <DropdownMenuItem onClick={() => handleDeleteExpense(expense)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
            Total Expenses: <span className="font-bold">₹{budget.totalExpenses}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
