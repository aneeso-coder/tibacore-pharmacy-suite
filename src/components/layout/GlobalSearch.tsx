import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Package, Users as UsersIcon, Receipt, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { products, customers, sales, users } from "@/data/seed";
import { useApp } from "@/context/AppContext";
import { fmtTZS, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Admin", pharmacist: "Pharmacist", cashier: "Cashier", viewer: "Viewer",
};

export function GlobalSearch() {
  const { user } = useApp();
  const isAdmin = user?.role === "super_admin";
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 200ms debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  // outside click + escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const ql = debounced.trim().toLowerCase();
    if (!ql) return null;
    return {
      products: products.filter((p) => p.name.toLowerCase().includes(ql) || p.barcode.includes(ql)).slice(0, 4),
      customers: customers.filter((c) => c.name.toLowerCase().includes(ql) || c.phone.includes(ql)).slice(0, 3),
      sales: sales.filter((s) => s.receiptNo.toLowerCase().includes(ql) || s.customerName.toLowerCase().includes(ql)).slice(0, 3),
      users: isAdmin ? users.filter((u) => u.name.toLowerCase().includes(ql) || u.email.toLowerCase().includes(ql)).slice(0, 2) : [],
    };
  }, [debounced, isAdmin]);

  const totalCount = results ? results.products.length + results.customers.length + results.sales.length + results.users.length : 0;

  const go = (path: string) => { setOpen(false); setQ(""); nav(path); };

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search products, customers, sales..."
        className="h-9 w-72 pl-8 bg-muted/40"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
      />
      {open && results && (
        <div className="absolute top-full left-0 mt-1 w-[420px] rounded-md border bg-popover shadow-lg z-50 max-h-[480px] overflow-y-auto">
          {totalCount === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Search className="h-5 w-5 opacity-50" />
              No results for "{debounced}"
            </div>
          ) : (
            <>
              <Group label="Products" icon={<Package className="h-3 w-3" />} hidden={!results.products.length}>
                {results.products.map((p) => {
                  const soh = p.stockMain + p.stockUpanga;
                  return (
                    <Item key={p.id} onClick={() => go("/products")}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]", soh <= p.reorderPoint && "text-warning border-warning/40")}>SOH {soh}</Badge>
                    </Item>
                  );
                })}
              </Group>
              <Group label="Customers" icon={<UsersIcon className="h-3 w-3" />} hidden={!results.customers.length}>
                {results.customers.map((c) => (
                  <Item key={c.id} onClick={() => go("/customers")}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground num">{c.phone}</div>
                    </div>
                  </Item>
                ))}
              </Group>
              <Group label="Sales" icon={<Receipt className="h-3 w-3" />} hidden={!results.sales.length}>
                {results.sales.map((s) => (
                  <Item key={s.id} onClick={() => go("/sales")}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium num">{s.receiptNo}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.customerName} • {fmtDate(s.date)}</div>
                    </div>
                    <span className="text-xs num font-medium">{fmtTZS(s.total)}</span>
                  </Item>
                ))}
              </Group>
              {isAdmin && (
                <Group label="Users" icon={<ShieldCheck className="h-3 w-3" />} hidden={!results.users.length}>
                  {results.users.map((u) => (
                    <Item key={u.id} onClick={() => go("/admin/users")}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[u.role]}</Badge>
                    </Item>
                  ))}
                </Group>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, icon, hidden, children }: { label: string; icon: React.ReactNode; hidden?: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return (
    <div className="border-b last:border-b-0">
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="pb-1">{children}</div>
    </div>
  );
}

function Item({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted text-left transition">
      {children}
    </button>
  );
}
