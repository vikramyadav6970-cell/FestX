'use server';

/**
 * @fileOverview An AI agent that provides personalized event recommendations to students based on their interests and past registrations.
 *
 * - getEventRecommendations - A function that retrieves event recommendations for a given student.
 * - EventRecommendationsInput - The input type for the getEventRecommendations function.
 * - EventRecommendationsOutput - The return type for the getEventRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventRecommendationsInputSchema = z.object({
  studentId: z.string().describe('The ID of the student for whom to generate event recommendations.'),
});
export type EventRecommendationsInput = z.infer<typeof EventRecommendationsInputSchema>;

const EventRecommendationsOutputSchema = z.object({
  eventRecommendations: z.array(z.string()).describe('A list of event IDs recommended for the student.'),
});
export type EventRecommendationsOutput = z.infer<typeof EventRecommendationsOutputSchema>;

export async function getEventRecommendations(input: EventRecommendationsInput): Promise<EventRecommendationsOutput> {
  return eventRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eventRecommendationsPrompt',
  input: {schema: EventRecommendationsInputSchema},
  output: {schema: EventRecommendationsOutputSchema},
  prompt: `You are an AI event recommendation system for a college event management system.
  Given a student ID, you will return a list of event IDs that are relevant to the student based on their interests and past registrations.

  Student ID: {{{studentId}}}

  Return the event recommendations in a JSON format.
  `,
});

const eventRecommendationsFlow = ai.defineFlow(
  {
    name: 'eventRecommendationsFlow',
    inputSchema: EventRecommendationsInputSchema,
    outputSchema: EventRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
