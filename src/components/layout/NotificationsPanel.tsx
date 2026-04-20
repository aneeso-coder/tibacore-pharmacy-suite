import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { products, batches, sales, invoices } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Bell, Clock, ShieldAlert, Coins, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { fmtTZS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  title: string;
  sub: string;
  tone: "warning" | "danger" | "info";
  to?: string;
}

export function NotificationsPanel({ open, onClose, onMarkAllRead }: { open: boolean; onClose: () => void; onMarkAllRead?: () => void }) {
  const { branch, user } = useApp();
  const nav = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const stockAlerts: AlertItem[] = useMemo(
    () =>
      products
        .filter((p) => {
          const qty = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
          return qty <= p.reorderPoint;
        })
        .slice(0, 12)
        .map((p) => {
          const qty = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
          return {
            id: `stock-${p.id}`,
            title: p.name,
            sub: `${qty} units left (reorder at ${p.reorderPoint})`,
            tone: qty === 0 ? "danger" : "warning",
            to: "/stock",
          };
        }),
    [branch.id]
  );

  const expiryAlerts: AlertItem[] = useMemo(
    () =>
      batches
        .map((b) => ({ ...b, days: Math.floor((+new Date(b.expiryDate) - Date.now()) / 86400000) }))
        .filter((b) => b.days >= 0 && b.days <= 90)
        .sort((a, b) => a.days - b.days)
        .slice(0, 10)
        .map((b) => {
          const p = products.find((x) => x.id === b.productId);
          return {
            id: `exp-${b.id}`,
            title: p?.name ?? "—",
            sub: `Batch ${b.batchNo} expires in ${b.days} day${b.days === 1 ? "" : "s"}`,
            tone: b.days <= 30 ? "danger" : "warning",
            to: "/batches",
          };
        }),
    []
  );

  const traAlerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];
    const failed = sales.find((s) => s.traStatus === "FAILED");
    if (failed) {
      items.push({
        id: "tra-fail-mock",
        title: `Receipt ${failed.receiptNo} failed`,
        sub: "TRA submission timeout — retry queued",
        tone: "danger",
        to: "/admin/tra",
      });
    }
    if (new Date().getHours() >= 18) {
      items.push({
        id: "tra-z-report",
        title: "Today's Z Report not yet submitted",
        sub: "Submit before midnight",
        tone: "warning",
        to: "/admin/tra",
      });
    }
    return items;
  }, []);

  const financialAlerts: AlertItem[] = useMemo(() => {
    if (user?.role !== "super_admin") return [];
    const overdue = invoices.filter((i) => i.status === "OVERDUE" || (i.status === "PARTIAL" && new Date(i.dueDate) < new Date()));
    if (!overdue.length) return [];
    const total = overdue.reduce((a, i) => a + (i.amount - i.paid), 0);
    return [{
      id: "fin-overdue",
      title: `${overdue.length} invoice${overdue.length === 1 ? "" : "s"} overdue`,
      sub: `${fmtTZS(total)} outstanding`,
      tone: "danger",
      to: "/invoices",
    }];
  }, [user?.role]);

  const filterDismissed = (items: AlertItem[]) => items.filter((i) => !dismissed.has(i.id));

  const sections = [
    { key: "stock", title: "Stock Alerts", icon: <Bell className="h-4 w-4 text-warning" />, items: filterDismissed(stockAlerts) },
    { key: "exp", title: "Expiry Alerts", icon: <Clock className="h-4 w-4 text-orange-500" />, items: filterDismissed(expiryAlerts) },
    { key: "tra", title: "TRA / Compliance", icon: <ShieldAlert className="h-4 w-4 text-destructive" />, items: filterDismissed(traAlerts) },
    { key: "fin", title: "Financial", icon: <Coins className="h-4 w-4 text-info" />, items: filterDismissed(financialAlerts) },
  ];

  const totalCount = sections.reduce((a, s) => a + s.items.length, 0);

  const goTo = (to?: string) => {
    if (!to) return;
    nav(to);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {sections.map((sec) =>
            sec.items.length === 0 && sec.key === "fin" ? null : (
              <Section key={sec.key} title={sec.title} icon={sec.icon} count={sec.items.length}>
                {sec.items.length === 0 ? (
                  <Empty text="All clear" />
                ) : (
                  sec.items.map((it) => (
                    <Row
                      key={it.id}
                      title={it.title}
                      sub={it.sub}
                      tone={it.tone}
                      onClick={() => goTo(it.to)}
                      onDismiss={() => setDismissed((prev) => new Set(prev).add(it.id))}
                    />
                  ))
                )}
              </Section>
            )
          )}
        </div>
        <div className="border-t p-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => { onMarkAllRead?.(); onClose(); }}>Mark all read</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setDismissed(new Set([...stockAlerts, ...expiryAlerts, ...traAlerts, ...financialAlerts].map((x) => x.id))); onMarkAllRead?.(); }}>Clear all</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} <span>{title}</span>
        {count > 0 && <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">{count}</Badge>}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ title, sub, tone, onClick, onDismiss }: { title: string; sub: string; tone: "warning" | "danger" | "info"; onClick?: () => void; onDismiss?: () => void }) {
  const dot = tone === "danger" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-info";
  return (
    <div className="flex gap-2.5 items-start py-1.5 group">
      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", dot)} />
      <button onClick={onClick} className="flex-1 min-w-0 text-left hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{sub}</div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition shrink-0 mt-1"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground py-2">{text}</div>;
}
