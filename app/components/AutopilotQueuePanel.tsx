"use client";

import { useState } from "react";
import { AutopilotQueueItem } from "../types/autopilot";
import { useAutopilotStore } from "../store/autopilotStore";
import { findBestWaitlistLead } from "../lib/waitlistEngine";

type OrderType =
  | "DINE_IN_RESERVATION"
  | "PREORDER_PICKUP"
  | "DELIVERY_PREORDER";

type OrderStatus =
  | "UNPAID"
  | "PAYMENT_SENT"
  | "PAID"
  | "CANCELLED"
  | "NO_SHOW";

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

type WaitlistLead = {
  id: number;
  customerName: string;
  phone: string;
  preferredType: OrderType;
  showProbability: number;
  responseSpeedScore: number;
  reliabilityScore: number;
};

function formatAutopilotAction(action: string) {
  switch (action) {
    case "SEND_PAYMENT_LINK":
      return "Send Payment Link";
    case "BLOCK_ORDER":
      return "Block Order";
    case "OFFER_WAITLIST":
      return "Offer to Waitlist";
    case "REDUCE_RELIABILITY":
      return "Reduce Reliability";
    case "FLAG_FRAUD":
      return "Flag Fraud";
    case "SEND_REMINDER":
      return "Send Reminder";
    case "RELEASE_SLOT":
      return "Release Slot";
    case "REQUIRE_DEPOSIT":
      return "Require Deposit";
    default:
      return action;
  }
}

function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalised = digits.startsWith("0") ? `6${digits}` : digits;
  return `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;
}

async function fetchOrders(): Promise<RestaurantOrder[]> {
  const res = await fetch("/api/orders", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

async function fetchWaitlist(): Promise<WaitlistLead[]> {
  const res = await fetch("/api/waitlist", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load waitlist");
  return res.json();
}

async function patchOrder(id: string, updates: Partial<RestaurantOrder>) {
  const res = await fetch("/api/orders", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...updates }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update order");
  }

  return data;
}

async function logAudit(action: string, staff: string, orderId: string) {
  await fetch("/api/audit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, staff, orderId }),
  });
}

async function executeAutopilotAction(item: AutopilotQueueItem) {
  const orders = await fetchOrders();
  const order = orders.find((o) => o.id === item.orderId);

  if (!order) {
    throw new Error(`Order ${item.orderId} not found`);
  }

  if (item.action === "SEND_PAYMENT_LINK") {
    await patchOrder(order.id, {
      status: "PAYMENT_SENT",
      paymentState: "LINK_SENT",
      notes: `Autopilot sent payment link. Deposit due: RM ${
        order.depositAmount ?? Math.round(order.amount * 0.3 * 100) / 100
      }`,
    });

    await logAudit("Autopilot executed payment link send", "Autopilot", order.id);
    window.open(`/pay/${order.id}`, "_blank");
    return;
  }

  if (item.action === "SEND_REMINDER") {
    const message = `Hi ${order.customerName}, this is a reminder that your booking/order (${order.id}) is coming up soon. Please complete payment or confirm your attendance.`;
    window.open(buildWhatsAppLink(order.phone, message), "_blank");
    await logAudit("Autopilot sent reminder", "Autopilot", order.id);
    return;
  }

  if (item.action === "BLOCK_ORDER") {
    await patchOrder(order.id, {
      paymentState: "BLOCKED",
      paymentVerified: false,
      notes: "Autopilot blocked this order pending verification.",
      protectionReason: "Blocked by autopilot",
    });

    await logAudit("Autopilot blocked order", "Autopilot", order.id);
    return;
  }

  if (item.action === "FLAG_FRAUD") {
    await patchOrder(order.id, {
      paymentState: "SUSPICIOUS",
      paymentVerified: false,
      terminalMismatch: true,
      notes: "Autopilot flagged suspicious payment activity.",
      protectionReason: "Fraud review required",
    });

    await logAudit("Autopilot flagged fraud", "Autopilot", order.id);
    return;
  }

  if (item.action === "RELEASE_SLOT") {
    await patchOrder(order.id, {
      status: "CANCELLED",
      notes: "Autopilot released the slot due to unpaid risk conditions.",
      protectionReason: "Slot released by autopilot",
    });

    await logAudit("Autopilot released slot", "Autopilot", order.id);
    return;
  }

  if (item.action === "OFFER_WAITLIST") {
    const waitlist = await fetchWaitlist();
    const recovery = findBestWaitlistLead(
      {
        id: order.id,
        orderType: order.orderType,
        amount: order.amount,
      },
      waitlist
    );

    if (!recovery.bestLead) {
      throw new Error("No suitable waitlist lead found");
    }

    const message = `Hi ${recovery.bestLead.customerName}, we just opened a ${order.orderType
      .replaceAll("_", " ")
      .toLowerCase()} slot/order worth RM ${order.amount}. Would you like it?`;

    window.open(buildWhatsAppLink(recovery.bestLead.phone, message), "_blank");
    await logAudit(
      `Autopilot offered slot to waitlist lead ${recovery.bestLead.customerName}`,
      "Autopilot",
      order.id
    );
    return;
  }

  if (item.action === "REDUCE_RELIABILITY") {
    const nextReliability = Math.max((order.reliabilityScore ?? 100) - 25, 0);

    await patchOrder(order.id, {
      reliabilityScore: nextReliability,
      notes: `Autopilot reduced reliability score to ${nextReliability}.`,
    });

    await logAudit("Autopilot reduced customer reliability", "Autopilot", order.id);
    return;
  }

  if (item.action === "REQUIRE_DEPOSIT") {
    const depositAmount =
      order.depositAmount ?? Math.round(order.amount * 0.3 * 100) / 100;

    await patchOrder(order.id, {
      depositRequired: true,
      depositAmount,
      notes: `Autopilot required deposit of RM ${depositAmount}.`,
    });

    await logAudit("Autopilot required deposit", "Autopilot", order.id);
    return;
  }
}

export default function AutopilotQueuePanel() {
  const { queue, markQueueItemDone, markQueueItemSkipped, revenueSaved } =
    useAutopilotStore();

  const [executingId, setExecutingId] = useState<string | null>(null);

  async function handleExecute(item: AutopilotQueueItem) {
    try {
      setExecutingId(item.id);
      await executeAutopilotAction(item);
      markQueueItemDone(item.id);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to execute action";
      alert(message);
    } finally {
      setExecutingId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white/70 p-6 shadow backdrop-blur-md">
      <h2 className="mb-4 text-xl font-semibold">Autopilot Activity</h2>

      <div className="mb-4">
        <span className="text-sm text-gray-500">Revenue Saved</span>
        <div className="text-2xl font-bold text-green-600">
          RM {revenueSaved.toFixed(2)}
        </div>
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <div className="text-sm text-gray-500">No autopilot actions yet.</div>
        )}

        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div>
              <div className="font-semibold">{item.customerName}</div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Action:</span>{" "}
                {formatAutopilotAction(item.action)}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Why:</span> {item.reason}
              </div>

              {item.estimatedRevenueProtected ? (
                <div className="text-sm text-green-600">
                  <span className="font-medium">Impact:</span> Protect RM{" "}
                  {item.estimatedRevenueProtected.toFixed(2)}
                </div>
              ) : null}

              <div className="mt-1 text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {item.status === "QUEUED" ? (
                <>
                  <button
                    onClick={() => handleExecute(item)}
                    disabled={executingId === item.id}
                    className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {executingId === item.id ? "Executing..." : "Execute"}
                  </button>

                  <button
                    onClick={() => markQueueItemSkipped(item.id)}
                    disabled={executingId === item.id}
                    className="rounded-lg bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Skip
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">{item.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}