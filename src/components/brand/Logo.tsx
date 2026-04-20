import { cn } from "@/lib/utils";
import logoUrl from "@/assets/tibacore-logo.png";

/**
 * Icon-only logo. Uses the full brand image but clips to just the
 * pill+leaves icon area (top-center of the source image).
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("inline-block overflow-hidden shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt="TibaCore"
        // Source image: icon occupies roughly the top ~55% of the canvas,
        // horizontally centered. Scale up & offset so only the icon shows.
        style={{
          width: size * 2.6,
          height: size * 2.6,
          marginLeft: -size * 0.8,
          marginTop: -size * 0.75,
          objectFit: "contain",
          maxWidth: "none",
        }}
      />
    </div>
  );
}

export function Wordmark({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const iconSize = size === "lg" ? 44 : size === "sm" ? 24 : 32;
  return (
    <div className="inline-flex items-center gap-2.5">
      <Logo size={iconSize} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-semibold tracking-tight text-foreground", text)}>TibaCore</span>
        {size !== "sm" && <span className="text-[11px] text-muted-foreground">Pharmacy. Simplified.</span>}
      </div>
    </div>
  );
}

/** Full brand lockup (icon + "TibaCore" + tagline) — for login, splash, etc. */
export function BrandLockup({ className, width = 280 }: { className?: string; width?: number }) {
  return (
    <img
      src={logoUrl}
      alt="TibaCore — Pharmacy Management"
      width={width}
      height={width}
      className={cn("object-contain", className)}
      style={{ width, height: "auto" }}
    />
  );
}
