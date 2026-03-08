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
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Microbusiness control panel – protect revenue & reduce no-shows.
            </p>
          </div>
          <Link
            href="/demo"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            View Booking Flow
          </Link>
        </div>
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

<div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Waitlist</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Use the waitlist to recover cancelled or no-show slots.
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
    <tr key={b.id} className="border-t">
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
          className={`px-2 py-1 rounded text-xs ${
            b.status === "Confirmed"
              ? "bg-green-100 text-green-700"
              : b.status === "Pending Deposit"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
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

  {b.status === "Confirmed" && (
    <button
      onClick={() => updateStatus(b.id, "No-show")}
      className="text-red-600 text-xs"
    >
      No-show
    </button>
  )}
{b.status === "No-show" && (
  <button
    onClick={() => fillSlotFromWaitlist(b.id)}
    className="text-blue-600 text-xs"
  >
    Fill slot
  </button>
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