"use client";

import { useEffect, useState } from "react";
import {
  getDangerousCustomers,
  getWorstTimeSlots,
  getStaffMistakes,
  getMoneySavedThisMonth,
  calculateSlotHealth,
  calculateRevenueLeakage,
  predictNoShowProbability,
  OrderRecord,
} from "../lib/intelligenceEngine";

export default function IntelligenceDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const dangerousCustomers = getDangerousCustomers(orders);
  const worstSlots = getWorstTimeSlots(orders);
  const staffMistakes = getStaffMistakes(orders);
  const savedThisMonth = getMoneySavedThisMonth(orders);
  const slotHealth = calculateSlotHealth(orders);
  const leakage = calculateRevenueLeakage(orders);

  return (
    <div className="rounded-2xl bg-white/70 p-6 shadow backdrop-blur-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Intelligence Dashboard</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card title="Saved This Month" value={`RM ${savedThisMonth}`} />
        <Card title="Revenue Leakage" value={`RM ${leakage.leakage}`} />
        <Card title="Recovered Revenue" value={`RM ${leakage.recovered}`} />
      </div>

      <Section title="Dangerous Customers">
        {dangerousCustomers.map((c) => (
          <div key={c.customerName}>
            {c.customerName} — No-shows: {c.noShows}, Cancels: {c.cancelled}
          </div>
        ))}
      </Section>

      <Section title="Worst Time Slots">
        {worstSlots.map((s) => (
          <div key={s.time}>
            {s.time} — {s.count} cancellations
          </div>
        ))}
      </Section>

      <Section title="Staff Mistakes">
        {staffMistakes.map((s) => (
          <div key={s.name}>
            {s.name} — {s.mistakes} issues
          </div>
        ))}
      </Section>

      <Section title="Slot Health Score">
        {slotHealth.map((s) => (
          <div key={s.time}>
            {s.time} — Health: {s.health}%
          </div>
        ))}
      </Section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}