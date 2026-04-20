import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

/**
 * Branch-aware filter widget.
 * - Admins (branchId === "ALL") see a Select dropdown with All / per-branch options.
 * - Other roles see their assigned branch as a static Badge — never a dropdown.
 *
 * Returns { value, control } where value is one of "ALL" | "br_main" | "br_upanga"
 * and control is the JSX to render in the filter bar.
 */
export function useBranchFilter(value: string, onChange: (v: string) => void) {
  const { user, branches } = useApp();
  const isAdmin = user?.branchId === "ALL";

  if (!isAdmin) {
    const b = branches.find((x) => x.id === user?.branchId);
    return {
      isAdmin: false as const,
      branchId: user?.branchId ?? "",
      control: (
        <Badge variant="outline" className="h-9 px-3 gap-1.5 font-medium">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {b?.name ?? "Branch"}
        </Badge>
      ),
    };
  }

  return {
    isAdmin: true as const,
    branchId: value,
    control: (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 h-9">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  };
}
