import { cn } from "@/lib/utils";

/** The official IOF logo, shown unmodified. `mark` crops the view to the emblem only (display crop, file untouched). */
export function IofLogo({ className, width = 176 }: { className?: string; width?: number }) {
  const h = (width * 124) / 314;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/iof-logo.png" alt="India Overseas Forum" width={width} height={h} className={cn("block rounded-lg", className)} style={{ width, height: h }} />
  );
}

export function IofMark({ size = 40, className }: { size?: number; className?: string }) {
  const scale = size / 100; // emblem is ~100px tall inside the 124px-high original
  return (
    <span
      role="img"
      aria-label="India Overseas Forum"
      className={cn("block shrink-0 rounded-full bg-[#f2fff6] bg-no-repeat", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/iof-logo.png)",
        backgroundSize: `${314 * scale}px ${124 * scale}px`,
        backgroundPosition: `${-(44 * scale)}px ${-(12 * scale)}px`,
      }}
    />
  );
}
