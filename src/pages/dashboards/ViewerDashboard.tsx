import { useMemo } from "react";
import { StatCard } from "@/components/ui-ext/StatCard";
import { Card } from "@/components/ui/card";
import { sales, products, customers } from "@/data/seed";
import { fmtTZS } from "@/lib/format";
import { Eye, Banknote, Package, Users } from "lucide-react";

export default function ViewerDashboard() {
  const todaySales = useMemo(() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return sales.filter((s) => new Date(s.date) >= t).reduce((a,s) => a + s.total, 0);
  }, []);

  return (
    <>
      <Card className="p-4 mb-6 border-info/30 bg-info/5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-info/10 text-info flex items-center justify-center">
          <Eye className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium text-sm">Read-only access</div>
          <div className="text-xs text-muted-foreground">You can view reports only. Contact an administrator for additional permissions.</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Sales Today" value={fmtTZS(todaySales)} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Products in Catalog" value={products.length} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Active Customers" value={customers.length} icon={<Users className="h-4 w-4" />} />
      </div>
    </>
  );
}
