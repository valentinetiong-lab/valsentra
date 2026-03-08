"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addBooking } from "../store/bookingStore";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number; // in MYR for now
};

type Slot = {
  id: string;
  label: string; // "10:30 AM"
  iso: string;   // "2026-03-01T10:30:00"
};

const SERVICES: Service[] = [
  { id: "s1", name: "Consultation", durationMin: 30, price: 60 },
  { id: "s2", name: "Standard Session", durationMin: 60, price: 120 },
  { id: "s3", name: "Premium Session", durationMin: 90, price: 180 },
];

function formatMYR(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(amount);
}

function tomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildSlots(dateISO: string): Slot[] {
  // Simple demo slots. Later we generate based on business hours + existing bookings.
  const times = ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "16:00"];
  return times.map((t, i) => {
    const iso = `${dateISO}T${t}:00`;
    const [hh, min] = t.split(":").map(Number);
    const ampm = hh >= 12 ? "PM" : "AM";
    const displayH = ((hh + 11) % 12) + 1;
    const label = `${displayH}:${String(min).padStart(2, "0")} ${ampm}`;
    return { id: `slot-${i}`, label, iso };
  });
}

export default function DemoBookingPage() {
    const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [serviceId, setServiceId] = useState<string>(SERVICES[1].id);
  const [dateISO, setDateISO] = useState<string>(tomorrowISODate());
  const [slotId, setSlotId] = useState<string>("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const service = useMemo(() => SERVICES.find(s => s.id === serviceId)!, [serviceId]);
  const slots = useMemo(() => buildSlots(dateISO), [dateISO]);
  const slot = useMemo(() => slots.find(s => s.id === slotId) || null, [slots, slotId]);

  // Demo deposit policy (we’ll make this configurable later)
  const deposit = useMemo(() => Math.round(service.price * 0.2), [service.price]);

  const canGoStep2 = Boolean(serviceId);
  const canGoStep3 = Boolean(slotId);
  const canConfirm = name.trim().length >= 2 && phone.trim().length >= 8;

  function reset() {
    setStep(1);
    setServiceId(SERVICES[1].id);
    setDateISO(tomorrowISODate());
    setSlotId("");
    setName("");
    setPhone("");
    setNotes("");
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-zinc-500">VALSENTRA • BOOKING DEMO</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Book an appointment</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Microbusiness-first flow: service → time → details → confirm.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Back to Home
          </Link>
        </div>

        {/* Stepper */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-xs">
          {[
            { n: 1, label: "Service" },
            { n: 2, label: "Time" },
            { n: 3, label: "Details" },
          ].map(s => (
            <div
              key={s.n}
              className={`rounded-lg border px-3 py-2 ${
                step === s.n ? "border-black bg-zinc-50" : "border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Step {s.n}</span>
                <span className="text-zinc-500">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold">Choose a service</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Keep it simple: customers pick what they want first.
              </p>

              <div className="mt-5 grid gap-3">
                {SERVICES.map(s => {
                  const active = s.id === serviceId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                        active ? "border-black bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {s.durationMin} min • {formatMYR(s.price)}
                        </div>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border ${
                          active ? "border-black bg-black" : "border-zinc-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canGoStep2}
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Next: choose time
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold">Pick a time</h2>
              <p className="mt-1 text-sm text-zinc-600">
                This is demo availability. Later we’ll connect real business hours + booked slots.
              </p>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-[220px]">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={dateISO}
                    onChange={(e) => {
                      setDateISO(e.target.value);
                      setSlotId("");
                    }}
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="text-sm font-medium">{service.name}</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {service.durationMin} min • {formatMYR(service.price)}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Deposit policy (demo): {formatMYR(deposit)} to confirm
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {slots.map(s => {
                  const active = s.id === slotId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-xl border px-3 py-3 text-sm transition ${
                        active ? "border-black bg-black text-white" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canGoStep3}
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Next: your details
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold">Your details</h2>
              <p className="mt-1 text-sm text-zinc-600">
                In the real app, we’ll verify phone + send confirmation + reminders.
              </p>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-sm font-medium">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amir Hakim"
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01X-XXXXXXX"
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <div className="mt-1 text-xs text-zinc-500">
                    (Later: WhatsApp/SMS confirmation + reminders)
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the business should know?"
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">Summary</div>
                <div className="mt-2 text-sm text-zinc-700">
                  <div><span className="text-zinc-500">Service:</span> {service.name}</div>
                  <div><span className="text-zinc-500">When:</span> {dateISO} {slot?.label ?? ""}</div>
                  <div><span className="text-zinc-500">Price:</span> {formatMYR(service.price)}</div>
                  <div><span className="text-zinc-500">Deposit to confirm:</span> {formatMYR(deposit)}</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  Back
                </button>

                <button
  onClick={() => {
   addBooking({
  id: crypto.randomUUID(),
  customer: name,
  phone: phone,
  service: service.name,
  date: dateISO,
  time: slot?.label ?? "",
  status: "Pending Deposit",
  deposit: deposit,
});

reset();
router.push("/dashboard");
 }}
>
  Confirm booking (demo)
</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
          <span>Demo only • No database yet</span>
          <Link href="/dashboard" className="underline underline-offset-4 hover:text-zinc-700">
            Go to Owner Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}