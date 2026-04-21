import { cn } from "@/lib/utils";
import logoUrl from "@/assets/tibacore-logo.png";

/**
 * Icon-only logo. The source image is the full lockup (icon + wordmark);
 * we crop to just the icon area using background-image positioning.
 *
 * Source image analysis (1024×1024 canvas):
 *   - Icon bounding box ≈ x: 33%–67%, y: 28%–55%
 *   - Icon aspect ratio ≈ 1:1, centered horizontally near x=50%, y=41%
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  // To show only the icon (~34% of the image width) inside a `size` box,
  // we scale the background so the icon ≈ size, i.e. bg-size ≈ size / 0.34.
  // Icon occupies ~26% of source canvas, centered at (50%, 39.5%).
  // Scale up so the icon ≈ `size`, then position the crop window on it.
  const bgSize = size / 0.26;
  return (
    <div
      className={cn("inline-block shrink-0 bg-no-repeat", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: `50% 39.5%`,
      }}
      role="img"
      aria-label="TibaCore"
    />
  );
}

export function Wordmark({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const iconSize = size === "lg" ? 44 : size === "sm" ? 26 : 34;
  return (
    <div className="inline-flex items-center gap-2.5">
      <Logo size={iconSize} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-semibold tracking-tight text-foreground", text)}>TibaCore</span>
        {size !== "sm" && (
          <span className="text-[11px] text-muted-foreground">Pharmacy. Simplified.</span>
        )}
      </div>
    </div>
  );
}

/** Full brand lockup (icon + "TibaCore") — for login, splash, etc. */
export function BrandLockup({ className, width = 280 }: { className?: string; width?: number }) {
  return (
    <img
      src={logoUrl}
      alt="TibaCore — Pharmacy Management"
      width={width}
      className={cn("object-contain", className)}
      style={{ width, height: "auto" }}
    />
  );
}
