'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, PiggyBank, Receipt, Banknote } from 'lucide-react';
import type { Budget, Event } from '@/types';

interface BudgetSummaryProps {
    budget: Budget;
    event: Event;
}

export function BudgetSummary({ budget, event }: BudgetSummaryProps) {
  const balance = budget.collectedIncome - budget.totalExpenses;
  const expectedIncome = (event.registrationCount || 0) * (event.amount || 0);

  const summaryItems = [
    {
      title: 'Expected Income',
      amount: expectedIncome,
      icon: <PiggyBank className="h-6 w-6 text-muted-foreground" />,
      description: `${event.registrationCount} × ₹${event.amount}`
    },
    {
      title: 'Collected Income',
      amount: budget.collectedIncome,
      icon: <Banknote className="h-6 w-6 text-muted-foreground" />,
      description: `${budget.verifiedPayments} paid`
    },
    {
      title: 'Expenses',
      amount: budget.totalExpenses,
      icon: <Receipt className="h-6 w-6 text-muted-foreground" />,
      description: `${budget.expenses.length} transactions`
    },
    {
      title: 'Balance',
      amount: balance,
      icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" />,
      description: balance >= 0 ? 'In profit' : 'In loss'
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{item.amount.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
