"use client";

import { useState, useEffect } from "react";
import { getEventRecommendations } from "@/ai/flows/event-recommendations";
import { mockEvents } from "@/lib/mock-data";
import type { Event } from "@/types";
import { EventCard } from "./event-card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export function EventRecommendations() {
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const result = await getEventRecommendations({ studentId: "student-123" });
        if (result && result.eventRecommendations) {
          // Simulate fetching full event details based on IDs
          const recommendedEvents = mockEvents.filter((event) =>
            result.eventRecommendations.includes(event.id)
          );
          // If AI returns nothing, show some other events
           if (recommendedEvents.length === 0) {
            setRecommendations(mockEvents.slice(3, 6));
          } else {
            setRecommendations(recommendedEvents);
          }
        }
      } catch (e) {
        console.error(e);
        setError("Failed to fetch recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[190px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (recommendations.length === 0) {
    return <p>No recommendations available at the moment.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
