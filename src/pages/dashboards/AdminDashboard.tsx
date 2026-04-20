import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui-ext/StatCard";
import { sales, products, batches, invoices, expenses, insurancePrices } from "@/data/seed";
import { fmtTZS } from "@/lib/format";
import { Banknote, Package, Wallet, AlertTriangle, PackageX, Clock, FileX2, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const PERIOD_OPTS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
] as const;
type PKey = typeof PERIOD_OPTS[number]["key"];

function periodStart(p: PKey) {
  const now = new Date();
  const d = new Date(now); d.setHours(0,0,0,0);
  if (p === "today") return d;
  if (p === "week") { const dow = (d.getDay()+6)%7; d.setDate(d.getDate() - dow); return d; }
  if (p === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export default function AdminDashboard() {
  const nav = useNavigate();
  const { branch } = useApp();
  const [period, setPeriod] = useState<PKey>("month");

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

  const revToday = sales.filter((s) => new Date(s.date) >= today).reduce((a,s) => a + s.total, 0);
  const revMonth = sales.filter((s) => new Date(s.date) >= monthStart).reduce((a,s) => a + s.total, 0);
  // Branch-aware total stock value
  const stockKey = branch.id === "br_main" ? "stockMain" : "stockUpanga";
  const stockValue = products.reduce((a,p) => a + (p as any)[stockKey] * p.buyPrice, 0);

  // COGS this month
  const cogsMonth = sales
    .filter((s) => new Date(s.date) >= monthStart)
    .reduce((a, s) => a + s.lines.reduce((b, l) => {
      const p = products.find((x) => x.id === l.productId);
      return b + (p ? p.buyPrice * l.qty : 0);
    }, 0), 0);
  const grossProfitMonth = revMonth - cogsMonth;
  const grossMargin = revMonth ? (grossProfitMonth / revMonth) * 100 : 0;

  // Operating expenses this month
  const expensesMonth = expenses
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((a, e) => a + e.amount, 0);
  const netProfitMonth = grossProfitMonth - expensesMonth;

  // Insurance receivable (mock — sum of insured prices for unpaid claims; here we use 35% of insured prices as outstanding)
  const insuranceReceivable = useMemo(() => {
    return Math.round(insurancePrices.reduce((a, ip) => a + ip.insuredPrice * 8, 0) * 0.35);
  }, []);

  // Period selector revenue (interactive on This Month card)
  const periodRev = useMemo(() => {
    const start = periodStart(period);
    return sales.filter((s) => new Date(s.date) >= start).reduce((a,s) => a + s.total, 0);
  }, [period]);

  // 14-day daily revenue
  const days14 = useMemo(() => {
    const arr: { label: string; revenue: number; tx: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const list = sales.filter((s) => new Date(s.date) >= d && new Date(s.date) < next);
      arr.push({ label: `${d.getDate()}/${d.getMonth()+1}`, revenue: list.reduce((a,s) => a + s.total, 0), tx: list.length });
    }
    return arr;
  }, [today]);

  // Payment method split
  const paymentSplit = useMemo(() => {
    const tally: Record<string, number> = { CASH: 0, MOBILE: 0, CARD: 0, CREDIT: 0 };
    sales.filter((s) => new Date(s.date) >= monthStart).forEach((s) => {
      tally[s.payment] = (tally[s.payment] || 0) + s.total;
    });
    return Object.entries(tally).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [monthStart]);

  // Branch comparison
  const branchComp = useMemo(() => {
    const m = sales.filter((s) => s.branchId === "br_main" && new Date(s.date) >= monthStart).reduce((a,s) => a + s.total, 0);
    const u = sales.filter((s) => s.branchId === "br_upanga" && new Date(s.date) >= monthStart).reduce((a,s) => a + s.total, 0);
    return [{ name: "Main", revenue: m }, { name: "Upanga", revenue: u }];
  }, [monthStart]);

  // Top 5
  const top5 = useMemo(() => {
    const tally: Record<string, number> = {};
    sales.filter((s) => new Date(s.date) >= monthStart).forEach((s) =>
      s.lines.forEach((l) => { tally[l.productId] = (tally[l.productId] || 0) + l.lineTotal; })
    );
    return Object.entries(tally).sort(([,a],[,b]) => b - a).slice(0, 5).map(([id, rev]) => ({
      name: products.find((p) => p.id === id)?.name.split(" ").slice(0,3).join(" ") ?? id,
      revenue: rev,
    }));
  }, [monthStart]);

  const lowStock = products.filter((p) => p.stockMain <= p.reorderPoint || p.stockUpanga <= p.reorderPoint).length;
  const expiring = batches.filter((b) => {
    const days = Math.floor((+new Date(b.expiryDate) - Date.now())/86400000);
    return days >= 0 && days <= 90;
  }).length;
  const traPending = sales.filter((s) => s.traStatus === "PENDING" || s.traStatus === "FAILED").length;
  const overdueInv = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <>
      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue Today" value={fmtTZS(revToday)} icon={<Banknote className="h-4 w-4" />} hint="All branches" />
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</div>
          <div className="text-2xl font-semibold mt-1 num truncate">{fmtTZS(periodRev)}</div>
          <div className="flex gap-1 mt-3">
            {PERIOD_OPTS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn("text-[11px] px-2 py-0.5 rounded-md transition",
                  period === p.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70 text-muted-foreground")}>
                {p.label}
              </button>
            ))}
          </div>
        </Card>
        <StatCard label="Total Stock Value" value={fmtTZS(stockValue)} icon={<Package className="h-4 w-4" />} tone="success" />
        <StatCard label="Gross Profit (Month)" value={fmtTZS(grossProfitMonth)} icon={<Wallet className="h-4 w-4" />} tone="success" hint={`${grossMargin.toFixed(1)}% margin`} />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-1">Daily Revenue — Last 14 Days</div>
          <div className="text-xs text-muted-foreground mb-3">All branches</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: any, _n, item: any) => [fmtTZS(Number(v)), `Revenue (${item.payload.tx} tx)`]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-medium mb-1">Payment Methods — This Month</div>
          <div className="text-xs text-muted-foreground mb-3">Hover for share</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {paymentSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => {
                  const total = paymentSplit.reduce((a,p) => a + p.value, 0);
                  return [`${fmtTZS(Number(v))} (${((Number(v)/total)*100).toFixed(1)}%)`, n];
                }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3 — Branch / Top / Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-1">Branch Comparison</div>
          <div className="text-xs text-muted-foreground mb-3">Revenue this month</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComp}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmtTZS(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-medium mb-1">Top 5 Products</div>
          <div className="text-xs text-muted-foreground mb-3">Revenue this month</div>
          <div className="space-y-2">
            {top5.map((t, i) => {
              const max = top5[0]?.revenue || 1;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="truncate pr-2">{i+1}. {t.name}</span>
                    <span className="num font-medium">{fmtTZS(t.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(t.revenue/max)*100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-medium mb-3">Alerts</div>
          <div className="space-y-2">
            <AlertChip icon={<PackageX className="h-3.5 w-3.5" />} label="Low Stock" count={lowStock} tone="warning" onClick={() => nav("/stock")} />
            <AlertChip icon={<Clock className="h-3.5 w-3.5" />} label="Near Expiry" count={expiring} tone="warning" onClick={() => nav("/batches")} />
            <AlertChip icon={<FileX2 className="h-3.5 w-3.5" />} label="TRA Pending" count={traPending} tone="danger" onClick={() => nav("/admin/tra")} />
            <AlertChip icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Overdue Invoices" count={overdueInv} tone="danger" onClick={() => nav("/debtors")} />
          </div>
        </Card>
      </div>

      {/* Row 4 — P&L */}
      <Card className="p-5">
        <div className="font-medium mb-1">P&amp;L Summary — This Month</div>
        <div className="text-xs text-muted-foreground mb-4">Derived from sales × buy prices</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PL label="Revenue" value={revMonth} />
          <PL label="COGS" value={cogsMonth} />
          <PL label="Gross Profit" value={grossProfitMonth} tone="success" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gross Margin</div>
            <div className="text-2xl font-semibold num mt-1 text-success">{grossMargin.toFixed(1)}%</div>
          </div>
        </div>
      </Card>
    </>
  );
}

function PL({ label, value, tone }: { label: string; value: number; tone?: "success" }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className={cn("text-2xl font-semibold num mt-1", tone === "success" && "text-success")}>{fmtTZS(value)}</div>
    </div>
  );
}

function AlertChip({ icon, label, count, tone, onClick }: { icon: React.ReactNode; label: string; count: number; tone: "warning"|"danger"; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition hover:bg-muted/50",
        tone === "danger" ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning")}>
      <span className="flex items-center gap-2">{icon}{label}</span>
      <span className="font-semibold num">{count}</span>
    </button>
  );
}
