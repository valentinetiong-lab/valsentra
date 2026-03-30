import Link from "next/link";

const problems = [
  {
    title: "No-shows",
    text: "Bookings look full, but revenue disappears when customers never turn up.",
  },
  {
    title: "Unpaid orders",
    text: "Staff prepare food or hold tables before payment is properly verified.",
  },
  {
    title: "Last-minute cancellations",
    text: "Time inventory dies quietly and owners only feel the loss after service hours.",
  },
];

const pillars = [
  {
    eyebrow: "Slot Protection",
    title: "Know which bookings are safe, exposed, or dangerous.",
    text: "Valsentra turns every booking or order into a live revenue object with risk, payment protection, and recovery status.",
  },
  {
    eyebrow: "Payment Control",
    title: "Do not release risky orders by mistake.",
    text: "Block unsafe flows, verify payment properly, and reduce operational mistakes before they become losses.",
  },
  {
    eyebrow: "Recovery Engine",
    title: "Recover revenue when bookings die.",
    text: "When a slot cancels or an order fails, Valsentra helps owners push recovery instead of just recording the loss.",
  },
];

const features = [
  "Revenue protected / at risk dashboard",
  "Deposit and payment rules",
  "Fraud and mismatch alerts",
  "Customer reliability scoring",
  "No-show and cancellation tracking",
  "Waitlist recovery workflow",
  "Staff-friendly action flow",
  "Owner rules engine",
];

const industries = [
  {
    title: "Restaurants",
    text: "Protect tables, preorders, large group bookings, and risky unpaid orders.",
  },
  {
    title: "Lash Techs & Beauty",
    text: "Protect appointment slots, premium sessions, deposits, and repeat no-show clients.",
  },
  {
    title: "Microbusinesses",
    text: "Any business where time slots or orders can quietly leak money.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(239,68,68,0.14),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_40%)]" />

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-neutral-950">
              V
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Valsentra</p>
              <p className="text-xs text-white/55">Revenue Protection System</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#industries" className="hover:text-white">
              Industries
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/restaurant"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              View Product
            </Link>
          </div>
        </nav>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 md:px-6 md:pb-20 md:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
              Restaurants • Beauty • Microbusinesses
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Stop losing revenue from{" "}
              <span className="text-red-400">no-shows</span>,{" "}
              <span className="text-red-400">unpaid orders</span>, and{" "}
              <span className="text-red-400">last-minute cancellations</span>.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              Valsentra helps service businesses see which bookings are safe,
              which are exposed, and which need protection before they turn into
              lost revenue.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/restaurant/owner"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
              >
                Open Owner Dashboard
              </Link>
              <Link
                href="/restaurant"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open Staff View
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <StatCard value="RM at risk" label="Visible before loss happens" />
              <StatCard value="Blocked" label="Unsafe orders stopped early" />
              <StatCard value="Recovery" label="Cancelled revenue pushed back" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[28px] border border-white/10 bg-neutral-900 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Today</p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Revenue Control
                    </h2>
                  </div>
                  <div className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                    LIVE RISK
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <GlassMetric title="Revenue Protected" value="RM 1,240" />
                  <GlassMetric title="Revenue At Risk" value="RM 620" />
                  <GlassMetric title="Blocked Orders" value="2" />
                  <GlassMetric title="Recovery Score" value="78/100" />
                </div>

                <div className="mt-5 rounded-3xl border border-red-300/15 bg-red-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">High-Risk Order</p>
                      <p className="mt-1 text-sm text-white/65">
                        Table reservation • 12 pax • unpaid • deposit required
                      </p>
                    </div>
                    <div className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                      BLOCKED
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">Autopilot Queue</p>
                  <div className="mt-3 space-y-3">
                    <MiniAlert
                      title="Deposit pending"
                      text="Large dine-in booking still unpaid."
                    />
                    <MiniAlert
                      title="Recovery opportunity"
                      text="Cancelled slot can be offered to waitlist."
                    />
                    <MiniAlert
                      title="Staff protection"
                      text="Terminal mismatch detected. Do not release."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 -top-3 hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur md:block">
              Premium SaaS feel
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {problems.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
                Problem
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"
      >
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
            How Valsentra works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            A silent assistant running behind the business.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/65">
            Staff should not think about risk every minute. The system should
            decide when payment is needed, when something is exposed, and when
            recovery should start.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
                {item.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"
      >
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
              Product capabilities
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Built for real operational loss, not just scheduling.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/65">
              Valsentra combines booking protection, payment control, fraud
              prevention, reliability tracking, and recovery workflows in one
              system.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-white/90"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="industries"
        className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20"
      >
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
            Who it is for
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Designed first for businesses where time and orders can quietly die.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {industries.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
            Final pitch
          </p>
          <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-bold tracking-tight md:text-5xl">
            Valsentra helps businesses prevent no-shows, unpaid orders, and
            hidden revenue loss before it happens.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/65">
            One system for risk visibility, payment protection, staff safety,
            and owner control.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/restaurant/owner"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
            >
              See Owner Dashboard
            </Link>
            <Link
              href="/restaurant"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See Staff Workflow
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </div>
  );
}

function GlassMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/55">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniAlert({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-6 text-white/60">{text}</p>
    </div>
  );
}