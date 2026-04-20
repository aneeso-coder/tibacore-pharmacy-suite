import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/brand/Logo";
import { toast } from "sonner";
import { Info } from "lucide-react";

const demos = [
  { role: "Admin", email: "emmanuel.solomon@tibacore.com", pw: "admin123" },
  { role: "Pharmacist", email: "pharmacist@tibacore.com", pw: "pharma123" },
  { role: "Cashier", email: "cashier@tibacore.com", pw: "cash123" },
  { role: "Viewer", email: "viewer@tibacore.com", pw: "view123" },
];

export default function Login() {
  const { login, user } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@tibacore.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (res.ok) {
        toast.success("Welcome back");
        nav("/");
      } else {
        toast.error(res.error ?? "Login failed");
      }
    }, 350);
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-sm border">
          <div className="flex justify-center mb-6">
            <Wordmark size="lg" />
          </div>
          <h2 className="text-lg font-semibold text-center mb-1">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your credentials below.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@pharmacy.com" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 rounded-md border bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Info className="h-3.5 w-3.5" /> Demo credentials — click to fill
            </div>
            <div className="space-y-1">
              {demos.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fill(d.email, d.pw)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-background transition flex justify-between items-center"
                >
                  <span className="font-medium text-foreground">{d.role}</span>
                  <span className="text-muted-foreground num">{d.email} / {d.pw}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} Neeso Pharmaceuticals Ltd</p>
      </div>
    </div>
  );
}
