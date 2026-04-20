import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui-ext/StatCard";
import { sales, products, batches, prescriptions } from "@/data/seed";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Banknote, FileText, Clock, PackageX } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PharmacistDashboard() {
  const nav = useNavigate();
  const { branch } = useApp();

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const branchSales = useMemo(() => sales.filter((s) => s.branchId === branch.id), [branch.id]);
  const stockKey = branch.id === "br_main" ? "stockMain" : "stockUpanga";

  const todaySales = branchSales.filter((s) => new Date(s.date) >= today).reduce((a,s) => a + s.total, 0);
  const pendingRx = prescriptions.filter((r) => r.status === "ACTIVE" || r.status === "PARTIAL").length;
  const expiring30 = batches.filter((b) => {
    const days = Math.floor((+new Date(b.expiryDate) - Date.now())/86400000);
    return days >= 0 && days <= 30;
  }).length;
  const lowStock = products.filter((p) => (p as any)[stockKey] <= p.reorderPoint).length;

  const days30 = useMemo(() => {
    const arr: { label: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      arr.push({
        label: `${d.getDate()}/${d.getMonth()+1}`,
        revenue: branchSales.filter((s) => new Date(s.date) >= d && new Date(s.date) < next).reduce((a,s) => a + s.total, 0),
      });
    }
    return arr;
  }, [branchSales, today]);

  const top5Week = useMemo(() => {
    const weekStart = new Date(today); const dow = (weekStart.getDay()+6)%7; weekStart.setDate(weekStart.getDate() - dow);
    const tally: Record<string, number> = {};
    branchSales.filter((s) => new Date(s.date) >= weekStart).forEach((s) =>
      s.lines.forEach((l) => { tally[l.productId] = (tally[l.productId] || 0) + l.qty; })
    );
    return Object.entries(tally).sort(([,a],[,b]) => b - a).slice(0, 5).map(([id, qty]) => ({
      name: products.find((p) => p.id === id)?.name.split(" ").slice(0,3).join(" ") ?? id,
      qty,
    }));
  }, [branchSales, today]);

  const expiryWatch = useMemo(() => {
    return batches.map((b) => {
      const days = Math.floor((+new Date(b.expiryDate) - Date.now())/86400000);
      return { ...b, days };
    }).filter((b) => b.days >= 0 && b.days <= 90).sort((a,b) => a.days - b.days).slice(0, 10);
  }, []);

  const pendingRxList = prescriptions.filter((r) => r.status === "ACTIVE" || r.status === "PARTIAL").slice(0, 8);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sales Today" value={fmtTZS(todaySales)} icon={<Banknote className="h-4 w-4" />} hint={branch.name} />
        <StatCard label="Pending Prescriptions" value={pendingRx} icon={<FileText className="h-4 w-4" />} tone={pendingRx > 0 ? "warning" : "default"} />
        <StatCard label="Expiring ≤30 days" value={expiring30} icon={<Clock className="h-4 w-4" />} tone={expiring30 > 0 ? "danger" : "default"} />
        <StatCard label="Low Stock Items" value={lowStock} icon={<PackageX className="h-4 w-4" />} tone={lowStock > 0 ? "warning" : "default"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-1">Sales Trend — Last 30 Days</div>
          <div className="text-xs text-muted-foreground mb-3">Daily revenue at {branch.name}</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days30}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtTZS(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-medium mb-1">Top 5 Products — This Week</div>
          <div className="text-xs text-muted-foreground mb-3">By units sold</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5Week} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium">Expiry Watchlist</div>
            <div className="text-xs text-muted-foreground">Soonest first — within 90 days</div>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {expiryWatch.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No expiries in next 90 days.</div>
            ) : expiryWatch.map((b) => {
              const p = products.find((x) => x.id === b.productId);
              return (
                <div key={b.id} className={cn("px-4 py-3 flex items-center justify-between gap-2", b.days <= 30 ? "bg-destructive/5" : "bg-warning/5")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p?.name}</div>
                    <div className="text-xs text-muted-foreground">Batch {b.batchNo} • {fmtDate(b.expiryDate)}</div>
                  </div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", b.days <= 30 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                    {b.days}d left
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="font-medium">Pending Prescriptions</div>
              <div className="text-xs text-muted-foreground">Awaiting dispense</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => nav("/prescriptions")}>View all</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRxList.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium num text-xs">{r.rxNo}</TableCell>
                  <TableCell className="truncate max-w-[140px]">{r.patient}</TableCell>
                  <TableCell className="text-right num">{r.lines.length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => nav("/pos", { state: { rxId: r.id, rxLines: r.lines } })}>Dispense</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
