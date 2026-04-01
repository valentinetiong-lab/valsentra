"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type OrderStatus =
  | "UNPAID"
  | "PAYMENT_SENT"
  | "PAID"
  | "CANCELLED"
  | "NO_SHOW";

type OrderType =
  | "DINE_IN_RESERVATION"
  | "PREORDER_PICKUP"
  | "DELIVERY_PREORDER";

type PaymentState =
  | "PENDING"
  | "LINK_SENT"
  | "SCREENSHOT_SUBMITTED"
  | "VERIFIED"
  | "SUSPICIOUS"
  | "BLOCKED";

type RestaurantOrder = {
  id: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  amount: number;
  guests: number;
  reservationTime: string;
  itemSummary: string;
  status: OrderStatus;
  paymentState?: PaymentState;
  paymentVerified?: boolean;
  depositRequired: boolean;
  depositAmount?: number;
  depositPaid: boolean;
  reliabilityScore: number;
  terminalMismatch: boolean;
  notes: string;
  assignedStaff: string;
  riskLevel?: "LOW" | "MED" | "HIGH";
  protectionReason?: string;
  createdAt?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getOrderTypeLabel(orderType: OrderType) {
  switch (orderType) {
    case "DINE_IN_RESERVATION":
      return "Dine-in";
    case "PREORDER_PICKUP":
      return "Pickup";
    case "DELIVERY_PREORDER":
      return "Delivery";
    default:
      return orderType;
  }
}

function paymentBadgeClasses(state?: PaymentState) {
  if (state === "VERIFIED") return "bg-green-100 text-green-700 border-green-200";
  if (state === "LINK_SENT") return "bg-blue-100 text-blue-700 border-blue-200";
  if (state === "SCREENSHOT_SUBMITTED")
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (state === "SUSPICIOUS" || state === "BLOCKED")
    return "bg-red-100 text-red-700 border-red-200";
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

export default function PayOrderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to load order.");
          return;
        }

        const found = (data as RestaurantOrder[]).find((o) => o.id === id) ?? null;
        setOrder(found);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOrder();
    }
  }, [id]);

  const amountDue = useMemo(() => {
    if (!order) return 0;
    if (order.depositRequired) return order.depositAmount ?? order.amount * 0.3;
    return order.amount;
  }, [order]);

  async function patchOrder(updates: Partial<RestaurantOrder>) {
    if (!order) return null;

    setSaving(true);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: order.id, ...updates }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update order.");
        return null;
      }

      setOrder(data);
      return data as RestaurantOrder;
    } finally {
      setSaving(false);
    }
  }

  async function logAudit(action: string) {
    if (!order) return;

    await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        staff: "Payment Page",
        orderId: order.id,
      }),
    });
  }

  async function handleScreenshotSubmitted() {
    const updated = await patchOrder({
      paymentState: "SCREENSHOT_SUBMITTED",
      notes: "Customer submitted screenshot. Awaiting verification.",
      status: order?.status === "UNPAID" ? "PAYMENT_SENT" : order?.status,
    });

    if (updated) {
      await logAudit("Customer submitted payment screenshot");
      setSuccessMessage("Screenshot submitted. Waiting for verification.");
    }
  }

  async function handleSimulatePaid() {
    const updated = await patchOrder({
      status: "PAID",
      paymentState: "VERIFIED",
      paymentVerified: true,
      depositPaid: true,
      terminalMismatch: false,
      protectionReason: "Payment verified",
      notes: "Payment marked paid from payment page.",
    });

    if (updated) {
      await logAudit("Payment marked verified from payment page");
      setSuccessMessage("Payment verified successfully.");
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 p-6">Loading payment page...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Order not found</h1>
          <p className="mt-3 text-sm text-neutral-600">
            The payment link may be invalid or the order does not exist.
          </p>
          <Link
            href="/restaurant"
            className="mt-6 inline-flex rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
          >
            Back to Staff View
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
                  Valsentra Payment
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Confirm Booking / Order
                </h1>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  Secure the slot by completing payment verification.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadgeClasses(
                    order.paymentState
                  )}`}
                >
                  {order.paymentState ?? "PENDING"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Order Summary</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Order ID" value={order.id} />
              <InfoCard label="Customer" value={order.customerName} />
              <InfoCard label="Type" value={getOrderTypeLabel(order.orderType)} />
              <InfoCard label="Reservation Time" value={order.reservationTime} />
              <InfoCard label="Guests" value={String(order.guests)} />
              <InfoCard label="Amount" value={formatCurrency(order.amount)} />
              <InfoCard
                label="Deposit Required"
                value={order.depositRequired ? "Yes" : "No"}
              />
              <InfoCard label="Amount Due Now" value={formatCurrency(amountDue)} />
            </div>

            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">Order Notes</p>
              <p className="mt-2 text-sm text-neutral-600">
                {order.notes || "No additional notes."}
              </p>
            </div>

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {successMessage}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Payment Actions</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This page simulates the payment verification workflow using your real order record.
            </p>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button
                onClick={handleScreenshotSubmitted}
                disabled={saving}
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit Screenshot"}
              </button>

              <button
                onClick={handleSimulatePaid}
                disabled={saving}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Simulate Verified Payment"}
              </button>

              <Link
                href="/restaurant"
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
              >
                Back to Staff View
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}