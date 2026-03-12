"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import {
  getWaitlist,
  addToWaitlist,
  removeFromWaitlist,
  type WaitlistEntry,
} from "../store/waitlistStore";
  import {
  getBookings,
   addBooking,
  updateBookingStatus,
  deleteBooking,
} from "../store/bookingStore";

import type { Booking } from "../store/bookingStore";

export default function DashboardPage() {
    
  const [bookings, setBookings] = useState<Booking[]>([]);
const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
useEffect(() => {
  setBookings(getBookings());
  setWaitlist(getWaitlist());
}, []);
function sendDepositLink(b: Booking) {
  const raw = (b.phone || "").replace(/\D/g, "");
  const msisdn = raw.startsWith("0") ? "6" + raw : raw;

  const msg =
    `Hi ${b.customer}, to confirm your appointment for ${b.service} on ${b.date} at ${b.time}, ` +
    `please pay a RM ${b.deposit} deposit. Payment link: https://yourpaymentlink.com Thanks!`;

  const url = `https://wa.me/${msisdn}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
const [showQuickAdd, setShowQuickAdd] = useState(false);
const [quickName, setQuickName] = useState("");
const [quickPhone, setQuickPhone] = useState("");
const [quickService, setQuickService] = useState("");
const [quickDate, setQuickDate] = useState("");
const [quickTime, setQuickTime] = useState("");
const [quickDeposit, setQuickDeposit] = useState("30");

  function updateStatus(id: string, newStatus: Booking["status"]) {
  const current = bookings.find(b => b.id === id);
  if (!current) return;

  const allowed: Record<Booking["status"], Booking["status"][]> = {
    "Pending Deposit": ["Confirmed", "No-show"],
    "Confirmed": ["No-show"],
    "No-show": [],
  };

  if (!allowed[current.status].includes(newStatus)) return;

  updateBookingStatus(id, newStatus);
  setBookings(getBookings());
}
const totalBookings = bookings.length;

const confirmedCount = bookings.filter(b => b.status === "Confirmed").length;
const noShowCount = bookings.filter(b => b.status === "No-show").length;

const revenue = bookings
  .filter(b => b.status === "Confirmed")
  .reduce((sum, b) => sum + b.deposit, 0);

const pendingDepositCount = bookings.filter(b => b.status === "Pending Deposit").length;

const pendingDepositValue = bookings
  .filter(b => b.status === "Pending Deposit")
  .reduce((sum, b) => sum + b.deposit, 0);

const noShowLoss = bookings
  .filter(b => b.status === "No-show")
  .reduce((sum, b) => sum + b.deposit, 0);

const noShowRate = totalBookings === 0
  ? 0
  : Math.round((noShowCount / totalBookings) * 100);

function removeBooking(id: string) {
  deleteBooking(id);
  setBookings(getBookings());
}
const riskScore = (b: Booking) => {
  let score = 0;

  // Rule 1: No deposit = higher risk
  if (b.status === "Pending Deposit") score += 2;

  // Rule 2: Short notice booking (same day) = higher risk
  // (only works if b.date is "YYYY-MM-DD")
  const today = new Date().toISOString().slice(0, 10);
  if (b.date === today) score += 1;

  return score; // 0 to 3
};

const riskLabel = (b: Booking) => {
  const s = riskScore(b);
  if (s >= 3) return "HIGH";
  if (s === 2) return "MED";
  return "LOW";
};
function sendReminder(b: Booking) {
  // Malaysia format: turn "0123456789" into "60123456789"
  const raw = (b.phone || "").replace(/\D/g, ""); // keep digits only
  const msisdn = raw.startsWith("0") ? "6" + raw : raw; // 0xxxxxxxxx -> 60xxxxxxxxx

  const msg =
  `Hi ${b.customer}, reminder for your ${b.service} on ${b.date} at ${b.time}. ` +
  `To secure the slot, please send deposit/payment RM ${b.deposit}. Thanks!`;
  const url = `https://wa.me/${msisdn}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
function addDemoWaitlist() {
  addToWaitlist({
    customer: "Sarah",
    phone: "0123456789",
    service: "Brow Lamination",
  });
  setWaitlist(getWaitlist());
}

function fillSlotFromWaitlist(bookingId: string) {
  if (waitlist.length === 0) {
    alert("No one is on the waitlist yet.");
    return;
  }
 

  const next = waitlist[0];
  alert(
    `Auto-fill triggered ✅\n\n` +
    `Send this slot to: ${next.customer}\n` +
    `Phone: ${next.phone}\n` +
    `Service: ${next.service}`
  );

  removeFromWaitlist(next.id);
  setWaitlist(getWaitlist());
}

function removeWaitlistEntry(id: string) {
  removeFromWaitlist(id);
  setWaitlist(getWaitlist());
}
const highRiskBookings = bookings.filter((b) => b.status === "Pending Deposit");
const highRiskCount = highRiskBookings.length;
const revenueProtected = bookings
  .filter((b) => b.status === "Confirmed")
  .reduce((sum, b) => sum + b.deposit, 0);
  const revenueAtRisk = bookings
  .filter((b) => b.status === "Pending Deposit")
  .reduce((sum, b) => sum + b.deposit, 0);
  function handleQuickAddBooking() {
  if (!quickName || !quickPhone || !quickService || !quickDate || !quickTime) {
    alert("Please fill in all booking fields.");
    return;
  }

  addBooking({
    id: crypto.randomUUID(),
    customer: quickName,
    phone: quickPhone,
    service: quickService,
    date: quickDate,
    time: quickTime,
    status: "Pending Deposit",
    deposit: Number(quickDeposit),
    reminderSent: false,
  });

  setBookings(getBookings());

  setQuickName("");
  setQuickPhone("");
  setQuickService("");
  setQuickDate("");
  setQuickTime("");
  setQuickDeposit("30");
  setShowQuickAdd(false);
}
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
       
       <div className="flex items-center justify-between flex-wrap gap-3">

  <div>
    <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
    <p className="mt-1 text-sm text-zinc-600">
      Microbusiness control panel – protect revenue & reduce no-shows.
    </p>
  </div>

  <div className="flex gap-3">
    <Link
  href="/settings"
  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
>
  Settings
</Link>
    <Link
      href="/demo"
      className="rounded-lg bg-black px-4 py-2 text-sm text-white"
    >
      View Booking Flow
    </Link>

    <button
      onClick={() => setShowQuickAdd(!showQuickAdd)}
      className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-100"
    >
      {showQuickAdd ? "Close Quick Add" : "Quick Add Booking"}
    </button>
  </div>

</div>
      
{showQuickAdd && (
  <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold text-zinc-900">Quick Add Booking</p>
    <p className="mt-1 text-sm text-zinc-600">
      Add bookings from WhatsApp, Instagram, phone calls, or walk-ins.
    </p>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <input
        value={quickName}
        onChange={(e) => setQuickName(e.target.value)}
        placeholder="Customer name"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        value={quickPhone}
        onChange={(e) => setQuickPhone(e.target.value)}
        placeholder="Phone number"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        value={quickService}
        onChange={(e) => setQuickService(e.target.value)}
        placeholder="Service"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        value={quickDate}
        onChange={(e) => setQuickDate(e.target.value)}
        placeholder="Date (e.g. 2026-03-15)"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        value={quickTime}
        onChange={(e) => setQuickTime(e.target.value)}
        placeholder="Time (e.g. 3:00 PM)"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        value={quickDeposit}
        onChange={(e) => setQuickDeposit(e.target.value)}
        placeholder="Deposit"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
    </div>

    <div className="mt-4 flex gap-3">
      <button
        onClick={handleQuickAddBooking}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white"
      >
        Create booking
      </button>

      <button
        onClick={() => setShowQuickAdd(false)}
        className="rounded-lg border px-4 py-2 text-sm"
      >
        Cancel
      </button>
    </div>
  </div>
)}



        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
  <p className="text-sm font-semibold text-amber-900">Risk Alert Panel</p>

  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">High Risk Bookings</p>
      <p className="text-lg font-semibold">{highRiskCount}</p>
    </div>

    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">Pending Deposits</p>
      <p className="text-lg font-semibold">{pendingDepositCount}</p>
    </div>

    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">Potential Loss</p>
      <p className="text-lg font-semibold">RM {pendingDepositValue}</p>
    </div>

    <div className="rounded-xl bg-white p-4 shadow-sm">
  <p className="text-xs text-zinc-500">Revenue at Risk Today</p>
  <p className="text-lg font-semibold text-red-600">
    RM {revenueAtRisk}
  </p>
</div>
  </div>


</div>
<p className="mt-8 text-sm font-semibold text-zinc-500">
  Business Metrics
</p>
<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Total */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">Total</p>
    <p className="text-lg font-semibold">{totalBookings}</p>
  </div>

  {/* Confirmed */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">Confirmed</p>
    <p className="text-lg font-semibold text-green-600">{confirmedCount}</p>
  </div>

  {/* No-shows */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">No-shows</p>
    <p className="text-lg font-semibold text-red-600">{noShowCount}</p>
  </div>

  {/* Revenue */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">Revenue (MYR)</p>
    <p className="text-lg font-semibold">RM {revenue}</p>
  </div>

<p className="mt-8 text-sm font-semibold text-zinc-500"> 
  Revenue Protection
</p>

{/* Revenue Protected */}
<div className="p-4 border rounded-xl">
  <p className="text-xs text-zinc-500">Revenue Protected</p>
  <p className="text-lg font-semibold text-green-600">
    RM {revenueProtected}
  </p>
</div>

  {/* Pending deposits */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">Pending deposits</p>
    <p className="text-lg font-semibold text-yellow-600">{pendingDepositCount}</p>
    <p className="text-xs text-zinc-500">Potential loss: RM {pendingDepositValue}</p>
  </div>

  {/* No-show loss */}
  <div className="p-4 border rounded-xl">
    <p className="text-xs text-zinc-500">No-show loss (MYR)</p>
    <p className="text-lg font-semibold">RM {noShowLoss}</p>
    <p className="text-xs text-zinc-500">Rate: {noShowRate}%</p>
  </div>

<div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Waitlist</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Automatically refill cancelled appointments from your waitlist.
      </p>
    </div>

    <button
      onClick={addDemoWaitlist}
      className="rounded-lg bg-black px-4 py-2 text-sm text-white"
    >
      Add demo waitlist entry
    </button>
  </div>

  <div className="mt-4 space-y-3">
    {waitlist.length === 0 ? (
      <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
        No one is on the waitlist yet.
      </div>
    ) : (
      waitlist.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 p-4"
        >
          <div>
            <div className="font-medium text-zinc-900">{w.customer}</div>
            <div className="text-sm text-zinc-600">
              {w.service} · {w.phone}
            </div>
          </div>

          <button
            onClick={() => removeWaitlistEntry(w.id)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))
    )}
  </div>
</div>
</div>
        <div className="mt-8 rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Actions</th>
            
              </tr>
            </thead>
            <tbody>
  {bookings.map((b) => (
    <tr
  key={b.id}
  className={b.status === "Pending Deposit" ? "border-t bg-yellow-50" : "border-t"}
>
      <td className="px-4 py-3">
        <div className="font-medium">{b.customer}</div>
        <div className="text-xs text-zinc-500">{b.phone}</div>
      </td>

      <td className="px-4 py-3">{b.service}</td>

      <td className="px-4 py-3">
        {b.date} • {b.time}
      </td>

      <td className="px-4 py-3">
  <span
    className={
      "rounded-full px-2 py-1 text-xs font-medium " +
      (b.status === "Confirmed"
        ? "bg-green-100 text-green-700"
        : b.status === "Pending Deposit"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700")
    }
  >
    {b.status}
  </span>
</td>
<td className="px-4 py-3">
  <span
    className={`px-2 py-1 rounded text-xs ${
      riskLabel(b) === "HIGH"
        ? "bg-red-100 text-red-700"
        : riskLabel(b) === "MED"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700"
    }`}
  >
    {riskLabel(b)}
  </span>
</td>
      <td className="px-4 py-3 space-x-2">
        {b.status === "Pending Deposit" && (
  <p className="mb-2 text-xs text-yellow-700">
    Deposit due: RM {b.deposit}
  </p>
)}
  {b.status === "Pending Deposit" && (
    <button
      onClick={() => updateStatus(b.id, "Confirmed")}
      className="text-green-600 text-xs"
    >
      Deposit Paid
    </button>
  )}
{b.status === "Pending Deposit" && (
  <button
    onClick={() => sendReminder(b)}
    className="text-blue-600 text-xs"
  >
    Send Reminder
  </button>
)}
  {b.status === "Pending Deposit" && (
    <button
      onClick={() => updateStatus(b.id, "No-show")}
      className="text-red-600 text-xs"
    >
      No-show
    </button>
  )}
 <button
  onClick={() => sendDepositLink(b)}
  className="text-green-600 text-xs"
>
  Send Deposit Link
</button>
  {b.status === "Confirmed" && (
    <button
      onClick={() => updateStatus(b.id, "No-show")}
      className="text-red-600 text-xs"
    >
      No-show
    </button>
  )}
{b.status === "No-show" && (
  <>
    <p className="mb-2 text-xs text-red-600">
      This empty slot can be offered to waitlist
    </p>
    <button
      onClick={() => fillSlotFromWaitlist(b.id)}
      className="text-blue-600 text-xs"
    >
      Fill from waitlist
    </button>
  </>
)}
  <button
    onClick={() => removeBooking(b.id)}
    className="text-zinc-500 text-xs"
  >
    Delete
  </button>
</td>
    </tr>
  ))}
</tbody>
          </table>

          {bookings.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              No bookings yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}