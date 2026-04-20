import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TraStatus } from "@/data/types";

const map: Record<TraStatus, { label: string; cls: string }> = {
  SUBMITTED: { label: "Submitted", cls: "bg-success/15 text-success border-success/30" },
  PENDING: { label: "Pending", cls: "bg-warning/15 text-warning border-warning/30" },
  FAILED: { label: "Failed", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function TraBadge({ status }: { status: TraStatus }) {
  const { label, cls } = map[status];
  return <Badge variant="outline" className={cn("font-medium", cls)}>{label}</Badge>;
}

export function StatusBadge({ status, tone = "default" }: { status: string; tone?: "default" | "success" | "warning" | "danger" | "info" }) {
  const cls = {
    default: "bg-muted text-muted-foreground border-border",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-destructive/15 text-destructive border-destructive/30",
    info: "bg-info/15 text-info border-info/30",
  }[tone];
  return <Badge variant="outline" className={cn("font-medium", cls)}>{status}</Badge>;
}
