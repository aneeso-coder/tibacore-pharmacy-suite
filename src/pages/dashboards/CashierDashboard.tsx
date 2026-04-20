import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui-ext/StatCard";
import { sales } from "@/data/seed";
import { fmtTZS } from "@/lib/format";
import { Banknote, ShoppingCart, Package, Printer } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))"];

export default function CashierDashboard() {
  const nav = useNavigate();
  const { user } = useApp();

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const mySalesToday = useMemo(
    () => sales.filter((s) => s.cashierId === user?.id && new Date(s.date) >= today),
    [user?.id, today]
  );

  const myCount = mySalesToday.length;
  const myRevenue = mySalesToday.reduce((a,s) => a + s.total, 0);
  const itemsSold = mySalesToday.reduce((a,s) => a + s.lines.reduce((b,l) => b + l.qty, 0), 0);

  const paymentSplit = useMemo(() => {
    const tally: Record<string, number> = { CASH: 0, MOBILE: 0, CARD: 0 };
    mySalesToday.forEach((s) => { tally[s.payment] = (tally[s.payment] || 0) + s.total; });
    return Object.entries(tally).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [mySalesToday]);

  const last5 = useMemo(
    () => [...mySalesToday].sort((a,b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5),
    [mySalesToday]
  );

  return (
    <>
      <Button onClick={() => nav("/pos")} className="w-full h-16 text-lg mb-6">
        <ShoppingCart className="h-5 w-5 mr-2" /> Open POS →
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="My Sales Today" value={myCount} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="My Revenue Today" value={fmtTZS(myRevenue)} icon={<Banknote className="h-4 w-4" />} tone="success" />
        <StatCard label="Items Sold Today" value={itemsSold} icon={<Package className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-medium mb-1">Today's Payment Mix</div>
          <div className="text-xs text-muted-foreground mb-3">Your sales only</div>
          <div className="h-64">
            {paymentSplit.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No sales yet today</div>
            ) : (
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
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium">Last 5 Sales</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Method</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {last5.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No sales yet</TableCell></TableRow>
              ) : last5.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="num text-xs">{new Date(s.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell className="text-right num">{s.lines.length}</TableCell>
                  <TableCell className="text-right num">{fmtTZS(s.total)}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{s.payment}</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.success(`Receipt ${s.receiptNo} reprinted`)}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
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
