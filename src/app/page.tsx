import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hotel, UtensilsCrossed, Bike, BarChart3, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold">
              IH
            </div>
            <span className="text-lg font-bold text-brand">IHG Platform</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-brand">Features</a>
            <a href="#modules" className="text-sm text-slate-600 hover:text-brand">Modules</a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-brand">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="accent">
              <Link href="/portal">Order food</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent/5" />
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-medium text-brand shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise hospitality, unified
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-brand md:text-6xl">
              Run your hotel, restaurant, and delivery —{" "}
              <span className="gradient-text">from one place.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              IHG Platform brings every team into a single, real-time system. Less paperwork,
              fewer mismatches, faster service — and the data leadership actually needs to make decisions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/login">
                  Sign in to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/portal/book">Book a room</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Demo accounts available — see <Link href="/login" className="text-brand underline">login page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-brand md:text-4xl">Four modules. One source of truth.</h2>
            <p className="mt-3 text-slate-600">
              Designed around how hospitality actually works. Each role sees exactly what they need.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Hotel,
                title: "Hotel",
                desc: "Rooms, bookings, check-in/out, housekeeping, in-room service.",
                color: "bg-brand-50 text-brand",
              },
              {
                icon: UtensilsCrossed,
                title: "Restaurant",
                desc: "Tables, reservations, kitchen tickets, menu, bills.",
                color: "bg-accent/10 text-accent",
              },
              {
                icon: Bike,
                title: "Delivery",
                desc: "Customer orders, live tracking, agent assignment.",
                color: "bg-emerald-50 text-emerald-700",
              },
              {
                icon: BarChart3,
                title: "Manager",
                desc: "Real-time dashboard, reports, alerts, audit trail.",
                color: "bg-amber-50 text-amber-700",
              },
            ].map((m) => (
              <div
                key={m.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm card-hover"
              >
                <div className={`inline-flex rounded-lg p-3 ${m.color}`}>
                  <m.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-brand md:text-4xl">Built for real operations</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Role-based access",
                desc: "Each user sees only what their job requires — front desk, kitchen, manager, admin.",
              },
              {
                icon: BarChart3,
                title: "Real-time dashboard",
                desc: "Occupancy, today's revenue, active orders, low inventory — at a glance.",
              },
              {
                icon: Sparkles,
                title: "AI-ready",
                desc: "Architecture supports future AI chat support and personalized recommendations.",
              },
            ].map((f) => (
              <div key={f.title}>
                <f.icon className="h-8 w-8 text-accent" />
                <h3 className="mt-4 text-lg font-semibold text-brand">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-bg py-20 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to see it in action?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Sign in with one of the demo accounts to explore each role's view.
          </p>
          <Button asChild size="lg" variant="accent" className="mt-6">
            <Link href="/login">
              Go to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} International Hospitality Group · IHG Platform v1.0
      </footer>

      {/* AI Chat Assistant */}
      <ChatWidget />
    </div>
  );
}
