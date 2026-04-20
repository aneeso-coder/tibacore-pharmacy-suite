import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function StatCard({
  label, value, hint, icon, tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "warning" | "success" | "danger";
}) {
  const toneClass = {
    default: "text-primary bg-primary-muted",
    warning: "text-warning bg-warning/10",
    success: "text-success bg-success/10",
    danger: "text-destructive bg-destructive/10",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-1 num truncate">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        {icon && (
          <div className={cn("h-9 w-9 rounded-md flex items-center justify-center shrink-0", toneClass)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
