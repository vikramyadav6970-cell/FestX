
"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Paintbrush } from 'lucide-react';

const PlaceholderPage = () => {
  return (
      <Card className="flex min-h-[200px] items-center justify-center">
        <CardContent className="p-6 text-center">
          <Paintbrush className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Appearance Settings</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This feature is under construction.
          </p>
        </CardContent>
      </Card>
  );
};

export default PlaceholderPage;
