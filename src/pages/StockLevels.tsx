import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui-ext/Page";
import { products, branches } from "@/data/seed";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { useBranchFilter } from "@/components/ui-ext/BranchFilter";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockLevels() {
  const { user } = useApp();
  const isAdmin = user?.branchId === "ALL";
  const [branchSel, setBranchSel] = useState("ALL");
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const branchFilter = useBranchFilter(branchSel, setBranchSel);

  const activeBranchId = isAdmin ? branchSel : (user?.branchId ?? "ALL");
  const activeBranchName =
    activeBranchId === "ALL" ? "All Branches" : branches.find((b) => b.id === activeBranchId)?.name ?? "";

  const sohFor = (p: typeof products[number]): number => {
    if (activeBranchId === "br_main") return p.stockMain;
    if (activeBranchId === "br_upanga") return p.stockUpanga;
    return p.stockMain + p.stockUpanga;
  };

  const filtered = useMemo(() => {
    let list = products;
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(ql));
    }
    if (lowOnly) list = list.filter((p) => sohFor(p) <= p.reorderPoint);
    return list;
  }, [q, lowOnly, activeBranchId]);

  const lowCount = products.filter((p) => sohFor(p) > 0 && sohFor(p) <= p.reorderPoint).length;
  const outCount = products.filter((p) => sohFor(p) === 0).length;

  return (
    <AppLayout title="Stock Levels">
      <PageHeader title="Stock Levels" description={`Inventory at ${activeBranchName}`} />

      {(lowCount > 0 || outCount > 0) && (
        <Card className={cn("p-3 mb-4 flex items-center gap-2", outCount > 0 ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5")}>
          <AlertTriangle className={cn("h-4 w-4", outCount > 0 ? "text-destructive" : "text-warning")} />
          <div className="text-sm">
            <span className={outCount > 0 ? "text-destructive font-medium" : "text-warning font-medium"}>{outCount}</span> out of stock,{" "}
            <span className="text-warning font-medium">{lowCount}</span> low at <span className="font-medium">{activeBranchName}</span>
          </div>
        </Card>
      )}

      <Card className="p-3 mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search products..." className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} />
        {branchFilter.control}
        <div className="flex items-center gap-2 ml-auto">
          <Switch id="low-only" checked={lowOnly} onCheckedChange={setLowOnly} />
          <Label htmlFor="low-only" className="text-sm cursor-pointer">Low stock only</Label>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead className="text-right">SOH {activeBranchId === "ALL" ? "(per branch)" : `(${activeBranchName})`}</TableHead>
              <TableHead className="text-right">Reorder Pt.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const soh = sohFor(p);
              const isLow = soh > 0 && soh <= p.reorderPoint;
              const isOut = soh === 0;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs">{p.packSize}</TableCell>
                  <TableCell className="text-right num font-medium">
                    {activeBranchId === "ALL" ? (
                      <span className="flex flex-col items-end leading-tight text-xs">
                        <span>Main: <span className="font-medium">{p.stockMain}</span></span>
                        <span>Upanga: <span className="font-medium">{p.stockUpanga}</span></span>
                      </span>
                    ) : soh}
                  </TableCell>
                  <TableCell className="text-right num text-muted-foreground">{p.reorderPoint}</TableCell>
                  <TableCell>
                    {isOut ? <Badge variant="outline" className="text-destructive border-destructive/30">Out of Stock</Badge>
                      : isLow ? <Badge variant="outline" className="text-warning border-warning/30">Low</Badge>
                      : <Badge variant="outline" className="text-success border-success/30">Healthy</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppLayout>
  );
}
