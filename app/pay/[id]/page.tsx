"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  depositRequired: boolean;
  depositPaid: boolean;
  reliabilityScore: number;
  terminalMismatch: boolean;
  notes: string;
  assignedStaff: string;
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

function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalised = digits.startsWith("0") ? `6${digits}` : digits;
  return `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;
}

export default function PayOrderPage() {
  const params = useParams();
  const id = String(params.id);

  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders?id=${id}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          console.error(data);
          setOrder(null);
          return;
        }

        setOrder(data);
      } catch (error) {
        console.error(error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  const amountDue = useMemo(() => {
    if (!order) return 0;

    if (order.depositRequired && !order.depositPaid) {
      return Math.min(order.amount, 100);
    }

    return order.amount;
  }, [order]);

  async function notifyStaffPaymentSent() {
    if (!order) return;

    setNotifying(true);

    try {
      const patchRes = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          status: order.status === "PAID" ? "PAID" : "PAYMENT_SENT",
          notes: "Customer said payment was made. Waiting for staff verification.",
        }),
      });

      const patchData = await patchRes.json();

      if (!patchRes.ok) {
        alert(patchData.error || "Failed to notify staff.");
        return;
      }

      setOrder(patchData);

      await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "Customer marked payment as sent",
          staff: "Customer",
          orderId: order.id,
        }),
      });

      const whatsappLink = buildWhatsAppLink(
        order.phone,
        `Hi, I have made payment for order ${order.id}. Please verify it.`
      );

      window.open(whatsappLink, "_blank");
    } catch (error) {
      console.error(error);
      alert("Failed to notify staff.");
    } finally {
      setNotifying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
        Loading payment page...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 md:px-6">
          <div className="w-full rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
              Valsentra Pay
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Order not found</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              This payment link does not match a live order.
            </p>

            <Link
              href="/restaurant"
              className="mt-5 inline-block rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
            >
              Back to Restaurant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const alreadyPaid = order.status === "PAID";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
              Valsentra Pay
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {alreadyPaid ? "Payment Confirmed" : "Complete Payment"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600 md:text-base">
              Clean customer view. No risk scores, no staff controls, no clutter.
            </p>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-neutral-500">Order ID</p>
                <p className="mt-1 text-lg font-semibold">{order.id}</p>
              </div>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  alreadyPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {alreadyPaid ? "PAID" : "PENDING"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-neutral-700 md:grid-cols-2">
              <p>
                <span className="font-medium text-neutral-900">Customer:</span>{" "}
                {order.customerName}
              </p>
              <p>
                <span className="font-medium text-neutral-900">Type:</span>{" "}
                {getOrderTypeLabel(order.orderType)}
              </p>
              <p>
                <span className="font-medium text-neutral-900">Time:</span>{" "}
                {order.reservationTime}
              </p>
              <p>
                <span className="font-medium text-neutral-900">Guests:</span>{" "}
                {order.guests}
              </p>
            </div>

            <div className="mt-4 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">Order summary</p>
              <p className="mt-2">{order.itemSummary}</p>
            </div>

            <div className="mt-6 rounded-[24px] bg-neutral-50 p-5 border border-neutral-200">
              <p className="text-sm text-neutral-500">
                {order.depositRequired && !order.depositPaid
                  ? "Deposit required"
                  : "Amount due"}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatCurrency(amountDue)}
              </p>
            </div>

            {!alreadyPaid ? (
              <>
                <div className="mt-6 rounded-[22px] border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                  <p className="font-semibold text-neutral-900">Payment instructions</p>
                  <p className="mt-2">
                    Transfer to the restaurant bank / QR, then notify staff below.
                  </p>
                  <p className="mt-2 text-neutral-500">
                    Staff will still verify manually before marking the order as fully paid.
                  </p>
                </div>

                <button
                  onClick={notifyStaffPaymentSent}
                  disabled={notifying}
                  className="mt-6 w-full rounded-2xl bg-black px-4 py-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {notifying ? "Notifying Staff..." : "I Have Paid — Notify Staff"}
                </button>

                <p className="mt-3 text-center text-xs text-neutral-500">
                  This does not auto-confirm payment. Staff verification is still required.
                </p>
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-semibold text-green-700">
                  Payment received successfully.
                </p>
                <p className="mt-2 text-sm text-green-700">
                  Your order is protected and ready for confirmation.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Views</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              This prototype separates the experience for customer, staff, and owner.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/restaurant"
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
              >
                Staff View
              </Link>
              <Link
                href="/restaurant/owner"
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
              >
                Owner View
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}