import { IMG } from "@/lib/utils";

export type GalleryPhoto = { src: string; alt: string };

/**
 * Gallery photos. To add or replace photos: drop files in /public/gallery and list them here
 * (e.g. { src: "/gallery/blood-camp-2026.jpg", alt: "Volunteers at the blood donation camp, Riyadh" }).
 * Write a real description in `alt`; it is the caption and the screen-reader text.
 * The entries below are the photos currently on iofseva.org (hot-linked until copied locally).
 */
export const GALLERY: GalleryPhoto[] = [
  { src: `${IMG}/WhatsApp-Image-2026-06-08-at-9.48.48-AM.jpeg`, alt: "IOF volunteers serving the community" },
  { src: `${IMG}/11.jpeg`, alt: "IOF community moment" },
  { src: `${IMG}/7-1.jpeg`, alt: "IOF seva activity" },
  { src: `${IMG}/9.jpeg`, alt: "IOF community celebration" },
  { src: `${IMG}/4-1.jpeg`, alt: "IOF community care" },
  { src: `${IMG}/WhatsApp-Image-2026-06-08-at-9.48.50-AM.jpeg`, alt: "IOF volunteers together" },
];
