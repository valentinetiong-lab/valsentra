"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {

  const [depositRequired, setDepositRequired] = useState(true);
  const [depositPercent, setDepositPercent] = useState(20);
  const [autoReminder, setAutoReminder] = useState(true);
  const [waitlistAutoFill, setWaitlistAutoFill] = useState(false);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-2xl px-6 py-10">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Owner Settings</h1>

          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 space-y-6">

          {/* Deposit Settings */}
          <div className="rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold">Deposit Settings</h2>

            <div className="mt-4 flex items-center justify-between">
              <span>Require deposit to confirm booking</span>
              <input
                type="checkbox"
                checked={depositRequired}
                onChange={(e)=>setDepositRequired(e.target.checked)}
              />
            </div>

            <div className="mt-4">
              <label className="text-sm">Deposit percentage</label>

              <input
                type="number"
                value={depositPercent}
                onChange={(e)=>setDepositPercent(Number(e.target.value))}
                className="mt-1 w-24 rounded border p-2"
              />
            </div>

          </div>

          {/* Reminder Settings */}
          <div className="rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold">Reminder Settings</h2>

            <div className="mt-4 flex items-center justify-between">
              <span>Send automatic reminder</span>
              <input
                type="checkbox"
                checked={autoReminder}
                onChange={(e)=>setAutoReminder(e.target.checked)}
              />
            </div>
          </div>

          {/* Waitlist Settings */}
          <div className="rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold">Waitlist Settings</h2>

            <div className="mt-4 flex items-center justify-between">
              <span>Automatically offer cancelled slots to waitlist</span>
              <input
                type="checkbox"
                checked={waitlistAutoFill}
                onChange={(e)=>setWaitlistAutoFill(e.target.checked)}
              />
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}