"use client";

import { useState } from "react";

type OrderStatus = "Unpaid" | "Payment Sent" | "Paid" | "Preparing" | "Ready";

type Order = {
  id: string;
  customer: string;
  phone: string;
  item: string;
  amount: number;
  status: OrderStatus;
  risk?: "Low" | "High";
  paidBy?: string;
  preparedBy?: string;
};

const initialOrders: Order[] = [
  {
    id: "1001",
    customer: "Jason",
    phone: "0123456789",
    item: "Family Combo",
    amount: 120,
    status: "Unpaid",
    risk: "Low",
  },
  {
    id: "1002",
    customer: "Farah",
    phone: "0198887766",
    item: "Wagyu Burger Set",
    amount: 68,
    status: "Payment Sent",
    risk: "Low",
  },
  {
    id: "1003",
    customer: "Unknown Number",
    phone: "0172221111",
    item: "Large Catering Tray",
    amount: 350,
    status: "Unpaid",
    risk: "High",
  },
  {
    id: "1004",
    customer: "Amir",
    phone: "0167774444",
    item: "Seafood Pasta",
    amount: 42,
    status: "Paid",
    risk: "Low",
  },
];

export default function RestaurantPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  function updateOrderStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;

        if (status === "Paid") {
          return { ...o, status, paidBy: "Staff A" };
        }

        if (status === "Preparing") {
          return { ...o, status, preparedBy: "Kitchen A" };
        }

        return { ...o, status };
      })
    );
  }

  function sendPaymentLink(order: Order) {
    const raw = (order.phone || "").replace(/\D/g, "");
    const msisdn = raw.startsWith("0") ? "6" + raw : raw;

    const msg =
      `Hi ${order.customer}, please complete payment for your order.\n\n` +
      `Order: ${order.item}\n` +
      `Amount: RM ${order.amount}\n\n` +
      `Reply once payment is done.`;

    const url = `https://wa.me/${msisdn}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    updateOrderStatus(order.id, "Payment Sent");
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Valsentra Restaurant Demo</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Anti-loss order flow: payment must be verified before preparation.
          </p>
        </div>

        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Order #{order.id}</p>
                  <h2 className="text-lg font-semibold">{order.customer}</h2>
                  <p className="text-sm text-zinc-600">{order.phone}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Item:</span> {order.item}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> RM {order.amount}
                  </p>

                  {order.risk === "High" && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      ⚠ High risk customer — require payment first
                    </div>
                  )}
                </div>

                <div className="min-w-[240px]">
                  {order.status === "Unpaid" && (
                    <div className="rounded-xl bg-red-50 p-4">
                      <p className="font-semibold text-red-700">
                        🔴 PAYMENT NOT VERIFIED
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        DO NOT PREPARE
                      </p>
                      <button
                        onClick={() => sendPaymentLink(order)}
                        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
                      >
                        Send Payment Link
                      </button>
                    </div>
                  )}

                  {order.status === "Payment Sent" && (
                    <div className="rounded-xl bg-yellow-50 p-4">
                      <p className="font-semibold text-yellow-700">
                        🟡 WAITING FOR PAYMENT
                      </p>
                      <button
                        onClick={() => updateOrderStatus(order.id, "Paid")}
                        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  )}

                  {order.status === "Paid" && (
                    <div className="rounded-xl bg-green-50 p-4">
                      <p className="font-semibold text-green-700">
                        🟢 PAYMENT VERIFIED
                      </p>
                      <button
                        onClick={() => updateOrderStatus(order.id, "Preparing")}
                        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
                      >
                        Start Preparing
                      </button>
                    </div>
                  )}

                  {order.status === "Preparing" && (
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-blue-700">🔵 PREPARING</p>
                      <button
                        onClick={() => updateOrderStatus(order.id, "Ready")}
                        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white"
                      >
                        Mark as Ready
                      </button>
                    </div>
                  )}

                  {order.status === "Ready" && (
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-700">
                        ✅ READY FOR PICKUP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
                <p>Marked Paid by: {order.paidBy || "-"}</p>
                <p>Prepared by: {order.preparedBy || "-"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}