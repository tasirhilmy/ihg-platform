"use client";

import { Suspense, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Hotel, Loader2, ShieldCheck } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "admin@ihg.com", password: "demo1234" },
  { role: "Manager", email: "manager@ihg.com", password: "demo1234" },
  { role: "Reception", email: "reception@ihg.com", password: "demo1234" },
  { role: "Housekeeping", email: "housekeeping@ihg.com", password: "demo1234" },
  { role: "Kitchen", email: "kitchen@ihg.com", password: "demo1234" },
  { role: "Waiter", email: "waiter@ihg.com", password: "demo1234" },
  { role: "Delivery", email: "delivery@ihg.com", password: "demo1234" },
  { role: "Customer", email: "customer@example.com", password: "demo1234" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/40" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
        return;
      }
      toast.success("Welcome back!");
      router.push(callbackUrl);
      router.refresh();
    });
  };

  const fillDemo = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
      <div className="container grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between p-10 lg:flex gradient-bg text-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-bold backdrop-blur">
              IH
            </div>
            <span className="text-lg font-bold">IHG Platform</span>
          </Link>
          <div>
            <Hotel className="h-12 w-12 text-accent" />
            <h2 className="mt-6 text-3xl font-bold leading-tight">
              One platform. Every team. Every shift.
            </h2>
            <p className="mt-4 max-w-md text-brand-100">
              Manage hotel operations, restaurant service, and food delivery from a single
              connected system — with role-based access and real-time visibility.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-brand-200">
              <ShieldCheck className="h-4 w-4" />
              Enterprise-grade security · audit logs · role-based access control
            </div>
          </div>
          <div className="text-xs text-brand-200">© {new Date().getFullYear()} IHG</div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold">
                IH
              </div>
              <span className="text-lg font-bold text-brand">IHG Platform</span>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>
                  Enter your credentials to access the IHG platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@ihg.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending} variant="accent">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demo accounts</CardTitle>
                <CardDescription>
                  Click to fill, then sign in. Password: <code className="rounded bg-slate-100 px-1">demo1234</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => fillDemo(acc.email, acc.password)}
                      type="button"
                      className="group flex flex-col items-start gap-0.5 rounded-md border border-slate-200 bg-white p-2 text-left text-xs transition hover:border-brand hover:bg-brand-50"
                    >
                      <span className="font-semibold text-brand">{acc.role}</span>
                      <span className="text-slate-500 group-hover:text-brand-700">{acc.email}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
