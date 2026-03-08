import Link from "next/link";
import EarlyAccessForm from "./components/EarlyAccessForm";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black" />
            <span className="font-semibold tracking-tight">Valsentra</span>
          </div>

          <nav className="flex items-center gap-3">
            <a className="text-sm text-zinc-600 hover:text-zinc-900" href="#how">
              How it works
            </a>
            <a className="text-sm text-zinc-600 hover:text-zinc-900" href="#features">
              Features
            </a>
            <a className="text-sm text-zinc-600 hover:text-zinc-900" href="#pricing">
              Pricing
            </a>
            <Link
              className="rounded-lg bg-black px-3 py-2 text-sm text-white"
              href="/demo"
            >
              Try demo
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            
  <p className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 shadow-sm">
    Revenue protection for beauty and appointment businesses
  </p>

  <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
    Stop no-shows. Protect every appointment.
  </h1>

  <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
    Valsentra helps lash, brow, nail, and beauty studios reduce cancellations
    with deposits, automated reminders, and slot recovery workflows.
  </p>

  <div className="mt-6 flex flex-wrap gap-3">
    <Link
      href="/demo"
      className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
    >
      Try the demo
    </Link>

    <a
      href="#early-access"
      className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
    >
      Get early access
    </a>
  </div>

  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-zinc-900">Deposits</div>
      <div className="mt-1 text-sm text-zinc-600">Confirm bookings faster</div>
    </div>

    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-zinc-900">Reminders</div>
      <div className="mt-1 text-sm text-zinc-600">WhatsApp-ready follow-ups</div>
    </div>

    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-zinc-900">Slot recovery</div>
      <div className="mt-1 text-sm text-zinc-600">Fill cancellations fast</div>
    </div>
  </div>
</div>

          {/* Right side “product preview” */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium text-zinc-900">Dashboard preview</div>
      <div className="mt-1 text-xs text-zinc-500">
        Track deposits, risk, no-shows, and revenue in one place
      </div>
    </div>
    <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-500">
      Live preview
    </span>
  </div>

  <div className="mt-5 grid grid-cols-2 gap-3">
    <StatCard title="Pending deposits" value="2" sub="Potential loss: RM 380" />
    <StatCard title="Revenue" value="RM 570" sub="Protected today" />
    <StatCard title="No-show rate" value="18%" sub="Last 30 days" />
    <StatCard title="High risk" value="1" sub="Reminder needed" />
  </div>

  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-zinc-900">Booking at risk</span>
      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
        Pending deposit
      </span>
    </div>

    <div className="mt-3 text-sm text-zinc-700">
      Brow Lamination · Today · 4:00 PM
    </div>

    <div className="mt-1 text-xs text-zinc-500">
      Deposit not paid yet. Send reminder before the slot is lost.
    </div>

    <div className="mt-4 flex gap-2">
      <button className="rounded-lg bg-black px-3 py-2 text-xs text-white">
        Send reminder
      </button>
      <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
        Mark deposit paid
      </button>
    </div>
  </div>
</div>
        </div>
      </section>

      {/* ROI strip */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 p-5">
            <div className="text-sm font-medium">Typical loss</div>
            <p className="mt-2 text-sm text-zinc-600">
              Even a few missed appointments per week adds up quickly.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5">
            <div className="text-sm font-medium">What Valsentra does</div>
            <p className="mt-2 text-sm text-zinc-600">
              Deposits + reminders + waitlist filling → fewer empty slots.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5">
            <div className="text-sm font-medium">Your advantage</div>
            <p className="mt-2 text-sm text-zinc-600">
              Works with how microbusinesses already operate (WhatsApp-first).
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Simple flows that reduce no-shows and recover cancellations.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <StepCard
            num="1"
            title="Customer books"
            desc="Booking page or WhatsApp link. Fast, mobile-first."
          />
          <StepCard
            num="2"
            title="Deposit protects the slot"
            desc="Require deposit for risky services or peak hours."
          />
          <StepCard
            num="3"
            title="Reminders + fill cancellations"
            desc="Send WhatsApp reminders and auto-fill from waitlist."
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-14">
        <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            title="Smart deposits"
            desc="Confirm bookings with deposits and clear cancellation rules."
          />
          <FeatureCard
            title="WhatsApp-ready reminders"
            desc="One-click reminders with prefilled messages."
          />
          <FeatureCard
            title="Risk scoring"
            desc="Highlight bookings likely to no-show so you act early."
          />
          <FeatureCard
            title="Waitlist slot-fill"
            desc="When someone cancels, notify waitlist instantly."
          />
          <FeatureCard
            title="Revenue dashboard"
            desc="Track revenue, loss, and potential loss at a glance."
          />
          <FeatureCard
            title="Policies & templates"
            desc="Polite scripts for deposits, reschedules, and no-shows."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Start simple. Upgrade when you want automation.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <PriceCard
              title="Starter"
              price="RM29/mo"
              bullets={[
                "Booking page + basic dashboard",
                "Email reminders",
                "Risk tags (LOW/MED/HIGH)",
              ]}
              ctaHref="#early-access"
              ctaText="Get early access"
            />
            <PriceCard
              title="Pro"
              price="RM59/mo"
              highlight
              bullets={[
                "Deposits (manual for MVP)",
                "WhatsApp one-click reminders",
                "Pending deposit alerts",
                "Waitlist slot-fill (manual trigger)",
              ]}
              ctaHref="#early-access"
              ctaText="Join Pro waitlist"
            />
            <PriceCard
              title="Business"
              price="RM99/mo"
              bullets={[
                "Multiple staff",
                "Advanced analytics",
                "Automations + integrations (later)",
              ]}
              ctaHref="#early-access"
              ctaText="Talk to us"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Faq q="Do I need to replace my current booking app?" a="No. Valsentra can start as a no-show protection layer: deposits + reminders + waitlist workflows." />
          <Faq q="Will customers hate deposits?" a="If you explain it politely and keep it small, many customers accept it—especially for peak hours or premium services." />
          <Faq q="Can I use WhatsApp only?" a="Yes. Valsentra is designed to fit WhatsApp-first workflows." />
          <Faq q="Is this ready for real payments?" a="Not yet in this MVP. We’ll add payment links next (ToyyibPay/Billplz/Stripe later)." />
        </div>
      </section>

      {/* Early access */}
      <section id="early-access" className="border-t border-zinc-200 bg-zinc-50">
        <div className="grid gap-6 lg:grid-cols-2">
  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
    <h3 className="text-xl font-semibold text-zinc-900">
      Join the early access waitlist
    </h3>
    <p className="mt-2 text-sm leading-6 text-zinc-600">
      Be one of the first beauty and appointment businesses to test Valsentra.
      We’re building it to reduce no-shows, protect revenue, and recover lost slots.
    </p>

    <div className="mt-5 space-y-3 text-sm text-zinc-600">
      <div className="rounded-xl border border-zinc-200 p-3">
        ✅ Get access to the private beta
      </div>
      <div className="rounded-xl border border-zinc-200 p-3">
        ✅ Try reminder + deposit workflows early
      </div>
      <div className="rounded-xl border border-zinc-200 p-3">
        ✅ Help shape the product for your business
      </div>
    </div>
  </div>

  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-zinc-900">Request early access</h3>
    <p className="mt-2 text-sm text-zinc-600">
      Leave your details and we’ll contact you when the beta is ready.
    </p>

    <EarlyAccessForm />
  </div>


          <footer className="mt-10 text-xs text-zinc-500">
            © {new Date().getFullYear()} Valsentra. Built for microbusinesses.
          </footer>
        </div>
      </section>
    </main>
 ) ;
}

function StatCard(props: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs text-zinc-500">{props.title}</div>
      <div className="mt-1 text-lg font-semibold">{props.value}</div>
      <div className="mt-1 text-xs text-zinc-500">{props.sub}</div>
    </div>
  );
}

function StepCard(props: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white">
          {props.num}
        </div>
        <div className="font-medium">{props.title}</div>
      </div>
      <p className="mt-3 text-sm text-zinc-600">{props.desc}</p>
    </div>
  );
}

function FeatureCard(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5">
      <div className="font-medium">{props.title}</div>
      <p className="mt-2 text-sm text-zinc-600">{props.desc}</p>
    </div>
  );
}

function PriceCard(props: {
  title: string;
  price: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        props.highlight ? "border-black bg-white" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold">{props.title}</div>
        {props.highlight && (
          <span className="rounded-full bg-black px-2 py-1 text-xs text-white">
            Recommended
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold">{props.price}</div>
      <ul className="mt-4 space-y-2 text-sm text-zinc-600">
        {props.bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>
      <a
        href={props.ctaHref}
        className={`mt-6 inline-block w-full rounded-xl px-4 py-3 text-center text-sm font-medium ${
          props.highlight
            ? "bg-black text-white"
            : "border border-zinc-200 bg-white"
        }`}
      >
        {props.ctaText}
      </a>
    </div>
  );
}

function Faq(props: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5">
      <div className="font-medium">{props.q}</div>
      <p className="mt-2 text-sm text-zinc-600">{props.a}</p>
    </div>
  );
}
