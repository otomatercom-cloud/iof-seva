import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const VOLUNTEER_URL = "/volunteer-registration";

export const IMG = "https://iofseva.org/wp-content/uploads/2026/06";
export const images = {
  logo: `${IMG}/WhatsApp-Image-2026-06-08-at-8.59.13-AM-Photoroom.png`,
  about: `${IMG}/WhatsApp-Image-2026-06-08-at-9.48.48-AM.jpeg`,
  community: `${IMG}/7-1.jpeg`,
  care: `${IMG}/4-1.jpeg`,
  moments: [`${IMG}/11.jpeg`, `${IMG}/9.jpeg`, `${IMG}/WhatsApp-Image-2026-06-08-at-9.48.50-AM.jpeg`],
};
