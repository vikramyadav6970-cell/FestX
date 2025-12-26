
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

const PlaceholderPage = ({ params }: { params: { eventId: string } }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Manage Volunteers
        </h1>
        <p className="text-muted-foreground">
          Manage volunteers for event: {params.eventId}
        </p>
      </div>
      <Card className="flex min-h-[400px] items-center justify-center">
        <CardContent className="p-6 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Manage Volunteers: Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This feature is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
