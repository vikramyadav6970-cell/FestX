import type { Event } from "@/types";
import { PlaceHolderImages } from "./placeholder-images";

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id) || { imageUrl: '', imageHint: '' };

export const mockEvents: Event[] = [
  {
    id: "tech-con-2024",
    title: "InnovateTech 2024",
    date: "2024-10-26",
    location: "Grand Auditorium",
    category: "Tech",
    organizer: "CS Department",
    imageUrl: getImage('event-1').imageUrl,
    imageHint: getImage('event-1').imageHint,
  },
  {
    id: "music-fest-spring",
    title: "Spring Sonic Bloom",
    date: "2024-11-15",
    location: "University Lawn",
    category: "Music",
    organizer: "Music Club",
    imageUrl: getImage('event-2').imageUrl,
    imageHint: getImage('event-2').imageHint,
  },
  {
    id: "sports-meet-fall",
    title: "Fall Olympics",
    date: "2024-09-20",
    location: "Sports Complex",
    category: "Sports",
    organizer: "Athletics Council",
    imageUrl: getImage('event-3').imageUrl,
    imageHint: getImage('event-3').imageHint,
  },
  {
    id: "cultural-night-2024",
    title: "Global Village Night",
    date: "2024-12-05",
    location: "Main Courtyard",
    category: "Culture",
    organizer: "International Students Org",
    imageUrl: getImage('event-4').imageUrl,
    imageHint: getImage('event-4').imageHint,
  },
  {
    id: "e-summit-2024",
    title: "Entrepreneurship Summit",
    date: "2024-11-08",
    location: "Business School Hall",
    category: "Business",
    organizer: "E-Cell",
    imageUrl: getImage('event-5').imageUrl,
    imageHint: getImage('event-5').imageHint,
  },
  {
    id: "film-fest-winter",
    title: "Winter Cinema Showcase",
    date: "2025-01-18",
    location: "Theatre Hall",
    category: "Arts",
    organizer: "Film Club",
    imageUrl: getImage('event-6').imageUrl,
    imageHint: getImage('event-6').imageHint,
  },
];
