import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { products, batches, sales } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PackageX, FileX2, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { branch } = useApp();
  const lowStock = products.filter((p) => {
    const qty = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
    return qty <= p.reorderPoint;
  }).slice(0, 8);

  const expiring = batches
    .map((b) => {
      const days = Math.floor((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
      return { ...b, days };
    })
    .filter((b) => b.days <= 90 && b.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const failedTra = sales.filter((s) => s.traStatus === "FAILED").slice(0, 4);

  const showZ = new Date().getHours() >= 18;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <Section title="Low stock" icon={<PackageX className="h-4 w-4 text-warning" />}>
            {lowStock.length === 0 ? <Empty text="All stocked up" /> : lowStock.map((p) => {
              const qty = branch.id === "br_main" ? p.stockMain : p.stockUpanga;
              const product = products.find(x => x.id === p.id)!;
              return (
                <Row key={p.id} title={p.name} sub={`${qty} / ${product.reorderPoint} units`} tone="warning" />
              );
            })}
          </Section>
          <Section title="Expiry alerts" icon={<Clock className="h-4 w-4 text-destructive" />}>
            {expiring.length === 0 ? <Empty text="No upcoming expiries" /> : expiring.map((b) => {
              const product = products.find((p) => p.id === b.productId);
              const tone = b.days <= 30 ? "danger" : "warning";
              return (
                <Row key={b.id} title={product?.name ?? "—"} sub={`Batch ${b.batchNo} • ${b.days} days remaining`} tone={tone} />
              );
            })}
          </Section>
          <Section title="TRA failures" icon={<FileX2 className="h-4 w-4 text-destructive" />}>
            {failedTra.length === 0 ? <Empty text="No failures" /> : failedTra.map((s) => (
              <Row key={s.id} title={s.receiptNo} sub="Submission failed — retry queued" tone="danger" />
            ))}
          </Section>
          {showZ && (
            <Section title="Z report reminder" icon={<AlertTriangle className="h-4 w-4 text-warning" />}>
              <Row title="Daily Z report not yet submitted" sub="Submit before midnight" tone="warning" />
            </Section>
          )}
        </div>
        <div className="border-t p-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm">Mark all read</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">Clear all</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ title, sub, tone }: { title: string; sub: string; tone: "warning" | "danger" | "info" }) {
  const dot = tone === "danger" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-info";
  return (
    <div className="flex gap-2.5 items-start py-1.5">
      <span className={`mt-1.5 h-2 w-2 rounded-full ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground py-2">{text}</div>;
}
