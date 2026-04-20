import { cn } from "@/lib/utils";
import iconUrl from "@/assets/tibacore-icon.png";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src={iconUrl}
      alt="TibaCore"
      width={size}
      height={size}
      className={cn("inline-block object-contain", className)}
      style={{ width: size, height: size }}
    />
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
