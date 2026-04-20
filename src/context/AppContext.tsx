import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { branches, users, credentials, ORG } from "@/data/seed";
import type { Branch, Role, User } from "@/data/types";

interface AppCtx {
  user: User | null;
  branch: Branch;
  branches: Branch[];
  org: typeof ORG;
  setBranch: (b: Branch) => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  can: (perm: Permission) => boolean;
  showPrices: boolean;
  showBuyPrices: boolean;
}

export type Permission =
  | "pos"
  | "sales:view_all"
  | "sales:view_own"
  | "inventory"
  | "purchasing"
  | "reports"
  | "reports:buy_prices"
  | "users"
  | "tra_settings"
  | "audit"
  | "system_settings"
  | "see_prices"
  | "debtors"
  | "creditors"
  | "invoices"
  | "adjustments:approve";

const rolePerms: Record<Role, Permission[]> = {
  super_admin: ["pos","sales:view_all","inventory","purchasing","reports","reports:buy_prices","users","tra_settings","audit","system_settings","see_prices","debtors","creditors","invoices","adjustments:approve"],
  pharmacist: ["pos","sales:view_all","inventory","purchasing","reports","reports:buy_prices","see_prices","adjustments:approve"],
  cashier: ["pos","sales:view_own","see_prices"],
  viewer: ["reports"],
};

const Ctx = createContext<AppCtx | null>(null);

const STORAGE = "tibacore_session";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch>(branches[0]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      try {
        const { userId, branchId } = JSON.parse(raw);
        const u = users.find((x) => x.id === userId) ?? null;
        if (u) {
          setUser(u);
          const b = branches.find((x) => x.id === branchId) ?? branches[0];
          setBranch(b);
        }
      } catch {}
    }
  }, []);

  const login = (email: string, password: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, error: "User not found" };
    if (credentials[u.email] !== password) return { ok: false, error: "Invalid credentials" };
    if (!u.active) return { ok: false, error: "Account disabled" };
    setUser(u);
    const defaultBranch =
      u.branchId === "ALL" ? branches[0] : branches.find((b) => b.id === u.branchId) ?? branches[0];
    setBranch(defaultBranch);
    localStorage.setItem(STORAGE, JSON.stringify({ userId: u.id, branchId: defaultBranch.id }));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE);
  };

  const value = useMemo<AppCtx>(() => {
    const can = (perm: Permission) => {
      if (!user) return false;
      return rolePerms[user.role].includes(perm);
    };
    return {
      user, branch, branches, org: ORG,
      setBranch: (b) => {
        setBranch(b);
        if (user) localStorage.setItem(STORAGE, JSON.stringify({ userId: user.id, branchId: b.id }));
      },
      login, logout, can,
      showPrices: !!user && user.role !== "viewer",
      showBuyPrices: !!user && (user.role === "super_admin" || user.role === "pharmacist"),
    };
  }, [user, branch]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Defensive: should not happen because AppProvider wraps the tree in App.tsx.
    // Return a safe default so the UI degrades to the login screen instead of crashing.
    console.warn("useApp called outside AppProvider — returning safe default");
    return {
      user: null,
      branch: branches[0],
      branches,
      org: ORG,
      setBranch: () => {},
      login: () => ({ ok: false, error: "Provider not ready" }),
      logout: () => {},
      can: () => false,
      showPrices: false,
      showBuyPrices: false,
    } as AppCtx;
  }
  return ctx;
};

