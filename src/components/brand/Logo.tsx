import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div className={cn("inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}
         style={{ width: size, height: size }}>
      <Pill className="rotate-45" style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}

export function Wordmark({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="inline-flex items-center gap-2">
      <Logo size={size === "lg" ? 36 : size === "sm" ? 22 : 28} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-semibold tracking-tight text-foreground", text)}>TibaCore</span>
        {size !== "sm" && <span className="text-[11px] text-muted-foreground">Pharmacy. Simplified.</span>}
      </div>
    </div>
  );
}
