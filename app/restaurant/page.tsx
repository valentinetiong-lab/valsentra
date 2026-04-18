"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAutopilotStore } from "../store/autopilotStore";
import type { RestaurantOrder as AutopilotOrder } from "../types/autopilot";
import { applyReliabilityEvent } from "../lib/reliabilityEngine";
import { calculateDepositDecision } from "../lib/depositEngine";
import { findBestWaitlistLead } from "../lib/waitlistEngine";
import type { PaymentState } from "../lib/paymentVerificationEngine";
import {
  sendPaymentLinkTransition,
  submitScreenshotTransition,
  verifyPaymentAmount,
} from "../lib/paymentVerificationEngine";

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

type RiskLevel = "LOW" | "MED" | "HIGH";
type PaymentStage = "DEPOSIT" | "FINAL";

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
  paymentStage?: PaymentStage;
  paymentVerified?: boolean;
  depositRequired: boolean;
  depositAmount: number;
  depositPaid: boolean;
  reliabilityScore: number;
  terminalMismatch: boolean;
  notes: string;
  assignedStaff: string;
  riskLevel?: RiskLevel;
  protectionReason?: string;
  createdAt?: string;
  recoverySourceOrderId?: string;
};

type RestaurantSettings = {
  id: number;
  dineInDepositGuestsThreshold: number;
  pickupDepositAmountThreshold: number;
  requireDeliveryDeposit: boolean;
  lowReliabilityThreshold: number;
  autoBlockHighValueUnpaid: boolean;
  hardBlockTerminalMismatch: boolean;
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

function statusBadgeClasses(status: OrderStatus) {
  if (status === "PAID") return "bg-green-100 text-green-700 border-green-200";
  if (status === "PAYMENT_SENT") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (status === "UNPAID") return "bg-red-100 text-red-700 border-red-200";
  if (status === "NO_SHOW") return "bg-orange-100 text-orange-700 border-orange-200";
  if (status === "CANCELLED") return "bg-neutral-200 text-neutral-700 border-neutral-300";
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function paymentBadgeClasses(state?: PaymentState) {
  if (state === "VERIFIED") return "bg-green-100 text-green-700 border-green-200";
  if (state === "LINK_SENT") return "bg-blue-100 text-blue-700 border-blue-200";
  if (state === "SCREENSHOT_SUBMITTED") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
  if (state === "SUSPICIOUS" || state === "BLOCKED") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function riskBadgeClasses(level: RiskLevel) {
  if (level === "HIGH") return "bg-red-100 text-red-700 border-red-200";
  if (level === "MED") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function mapStaffStatusToAutopilotStatus(
  status: OrderStatus
): AutopilotOrder["status"] {
  if (status === "PAID") return "Paid";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "NO_SHOW") return "No-show";
  return "Pending";
}

function mapStaffOrderTypeToAutopilotType(
  orderType: OrderType
): AutopilotOrder["orderType"] {
  if (orderType === "DINE_IN_RESERVATION") return "DINE_IN";
  if (orderType === "DELIVERY_PREORDER") return "DELIVERY";
  return "PICKUP";
}

function getStaffAutopilotDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function getStaffAutopilotTime(value?: string) {
  if (!value) return "18:00";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "18:00";
  }

  return parsed.toTimeString().slice(0, 5);
}

function getEffectiveDepositAmount(order: RestaurantOrder) {
  const totalAmount = Number(order.amount ?? 0);
  const rawDepositAmount = Number(order.depositAmount ?? 0);

  if (rawDepositAmount > 0) return rawDepositAmount;
  if (order.depositRequired) {
    return Math.round(totalAmount * 0.3 * 100) / 100;
  }

  return 0;
}

function getAmountDueNow(order: RestaurantOrder) {
  const totalAmount = Number(order.amount ?? 0);
  const effectiveDepositAmount = getEffectiveDepositAmount(order);

  if (order.status === "PAID") return 0;

  if (order.depositRequired && !order.depositPaid) {
    return effectiveDepositAmount;
  }

  if (order.depositRequired && order.depositPaid) {
    return Math.max(totalAmount - effectiveDepositAmount, 0);
  }

  return totalAmount;
}

function getPaymentStageLabel(order: RestaurantOrder) {
  if (order.status === "PAID") return "Fully paid";
  if (order.depositRequired && !order.depositPaid) return "Deposit due";
  return "Final balance due";
}

export default function RestaurantStaffPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { evaluateOrders } = useAutopilotStore();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    customerName: "",
    phone: "",
    amount: "",
    guests: "2",
    reservationTime: "",
    itemSummary: "",
    orderType: "PREORDER_PICKUP" as OrderType,
    assignedStaff: "Aiman",
  });

  useEffect(() => {
    async function boot() {
      try {
        await Promise.all([loadOrders(), loadSettings(), loadWaitlist()]);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  async function loadOrders() {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setOrders(data);
  }

  async function loadSettings() {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setSettings(data);
  }

  async function loadWaitlist() {
    const res = await fetch("/api/waitlist", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setWaitlist(data);
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

  function isBlacklisted(score: number) {
    return score <= 10;
  }

  function getRiskLevel(input: {
    amount: number;
    guests: number;
    reliabilityScore: number;
    terminalMismatch: boolean;
    status: OrderStatus;
    orderType: OrderType;
  }): RiskLevel {
    let score = 0;

    if (input.terminalMismatch) score += 3;
    if (input.reliabilityScore <= 20) score += 3;
    else if (input.reliabilityScore <= 50) score += 2;

    if (input.amount >= 300) score += 2;
    else if (input.amount >= 150) score += 1;

    if (input.orderType === "DINE_IN_RESERVATION" && input.guests >= 10) score += 2;
    else if (input.orderType === "DINE_IN_RESERVATION" && input.guests >= 6) score += 1;

    if (input.status === "UNPAID") score += 1;
    if (input.status === "PAYMENT_SENT") score += 1;

    if (score >= 5) return "HIGH";
    if (score >= 3) return "MED";
    return "LOW";
  }

  function getProtectionReason(input: {
    depositRequired: boolean;
    reliabilityScore: number;
    terminalMismatch: boolean;
    amount: number;
    guests: number;
    orderType: OrderType;
  }) {
    if (input.terminalMismatch) return "Terminal mismatch";
    if (isBlacklisted(input.reliabilityScore)) return "Blacklisted customer";
    if (input.reliabilityScore <= 20) return "Very low reliability";

    if (
      input.orderType === "DINE_IN_RESERVATION" &&
      settings &&
      input.guests >= settings.dineInDepositGuestsThreshold
    ) {
      return "Large dine-in booking";
    }

    if (
      input.orderType === "PREORDER_PICKUP" &&
      settings &&
      input.amount >= settings.pickupDepositAmountThreshold
    ) {
      return "High-value pickup";
    }

    if (input.depositRequired) return "Deposit required";

    return "Standard protection";
  }

  function isBlocked(order: RestaurantOrder) {
    if (order.status === "PAID") return false;
    if (order.status === "CANCELLED" || order.status === "NO_SHOW") return false;
    if (order.terminalMismatch) return true;
    if (order.paymentState === "BLOCKED" || order.paymentState === "SUSPICIOUS") {
      return true;
    }
    if (getAmountDueNow(order) > 0) return true;
    if (isBlacklisted(order.reliabilityScore)) return true;
    return false;
  }

  function getProtectionStatus(order: RestaurantOrder) {
    if (order.status === "PAID") return "Protected";
    if (order.status === "CANCELLED") return "Cancelled";
    if (order.status === "NO_SHOW") return "Lost";
    if (isBlacklisted(order.reliabilityScore)) return "Blacklisted";
    if (order.depositRequired && order.depositPaid) return "Deposit secured";
    if (isBlocked(order)) return "Blocked until verified";
    if (order.status === "PAYMENT_SENT") return "Waiting payment";
    return "Unprotected";
  }

  function getProtectionTone(order: RestaurantOrder) {
    if (order.status === "PAID") return "text-green-700";
    if (order.status === "CANCELLED" || order.status === "NO_SHOW") {
      return "text-neutral-700";
    }
    if (order.depositRequired && order.depositPaid) return "text-blue-700";
    if (isBlocked(order)) return "text-red-700";
    if (order.status === "PAYMENT_SENT") return "text-yellow-700";
    return "text-neutral-700";
  }

  function getBestWaitlistLead(order: RestaurantOrder) {
    return findBestWaitlistLead(
      {
        id: order.id,
        orderType: order.orderType,
        amount: order.amount,
      },
      waitlist
    );
  }

  async function patchOrder(id: string, updates: Partial<RestaurantOrder>) {
    setSaving(true);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update order.");
        return null;
      }

      setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
      return data as RestaurantOrder;
    } finally {
      setSaving(false);
    }
  }

  async function createRecoveredOrderFromLead(
    originalOrder: RestaurantOrder,
    lead: WaitlistLead
  ) {
    if (!settings) {
      alert("Settings not loaded yet.");
      return;
    }

    setSaving(true);

    try {
      const replacementOrder: RestaurantOrder = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: lead.customerName,
        phone: lead.phone,
        orderType: originalOrder.orderType,
        amount: 0,
        guests: originalOrder.guests,
        reservationTime: originalOrder.reservationTime,
        itemSummary: `Recovered slot from ${originalOrder.id} • Awaiting actual order details`,
        status: "UNPAID",
        paymentState: "PENDING",
        paymentStage: "FINAL",
        paymentVerified: false,
        depositRequired: false,
        depositAmount: 0,
        depositPaid: false,
        reliabilityScore: lead.reliabilityScore,
        terminalMismatch: false,
        notes: `Recovered from ${originalOrder.id}. Customer accepted slot, but actual order value/details still need to be entered.`,
        assignedStaff: "Recovery",
        riskLevel: "LOW",
        protectionReason: "Recovered slot • awaiting actual order details",
        recoverySourceOrderId: originalOrder.id,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(replacementOrder),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create recovered order.");
        return;
      }

      setOrders((prev) => [data, ...prev]);

      await patchOrder(originalOrder.id, {
        notes: `${originalOrder.notes} | Waitlist slot accepted by ${lead.customerName}. Replacement order created as draft.`,
      });

      await logAudit(
        `Recovered slot ${originalOrder.id} with waitlist lead ${lead.customerName}. Draft replacement order created.`,
        "Staff",
        data.id
      );

      alert(`Recovered slot with ${lead.customerName}. Draft replacement order created.`);
    } finally {
      setSaving(false);
    }
  }

  async function markCancelled(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const newReliability = applyReliabilityEvent(
      target.reliabilityScore,
      "ORDER_CANCELLED"
    );

    const newRisk = getRiskLevel({
      amount: target.amount,
      guests: target.guests,
      reliabilityScore: newReliability,
      terminalMismatch: target.terminalMismatch,
      status: "CANCELLED",
      orderType: target.orderType,
    });

    const protectionReason = getProtectionReason({
      depositRequired: target.depositRequired,
      reliabilityScore: newReliability,
      terminalMismatch: target.terminalMismatch,
      amount: target.amount,
      guests: target.guests,
      orderType: target.orderType,
    });

    const updated = await patchOrder(orderId, {
      status: "CANCELLED",
      reliabilityScore: newReliability,
      riskLevel: newRisk,
      protectionReason,
      notes: "Order cancelled.",
    });

    if (updated) {
      await logAudit("Marked order cancelled", "Staff", orderId);
    }
  }

  async function markNoShow(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const newReliability = applyReliabilityEvent(
      target.reliabilityScore,
      "NO_SHOW"
    );

    const newRisk = getRiskLevel({
      amount: target.amount,
      guests: target.guests,
      reliabilityScore: newReliability,
      terminalMismatch: target.terminalMismatch,
      status: "NO_SHOW",
      orderType: target.orderType,
    });

    const protectionReason = getProtectionReason({
      depositRequired: target.depositRequired,
      reliabilityScore: newReliability,
      terminalMismatch: target.terminalMismatch,
      amount: target.amount,
      guests: target.guests,
      orderType: target.orderType,
    });

    const updated = await patchOrder(orderId, {
      status: "NO_SHOW",
      reliabilityScore: newReliability,
      riskLevel: newRisk,
      protectionReason,
      notes: "Customer did not show up.",
    });

    if (updated) {
      await logAudit("Marked order no-show", "Staff", orderId);
    }
  }

  async function verifyAndMarkPaid(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const expectedAmount = getAmountDueNow(target);

    if (expectedAmount <= 0) {
      alert("There is no payment due for this order right now.");
      return;
    }

    const input = window.prompt(
      `Enter terminal amount received for ${orderId}.\nExpected now: ${expectedAmount}`
    );

    if (input === null) return;

    const enteredAmount = Number(input);

    if (Number.isNaN(enteredAmount)) {
      alert("Invalid amount.");
      return;
    }

    const verification = verifyPaymentAmount(expectedAmount, enteredAmount);

    const nextReliability = verification.reliabilityEvent
      ? applyReliabilityEvent(target.reliabilityScore, verification.reliabilityEvent)
      : target.reliabilityScore;

    const nextRisk = getRiskLevel({
      amount: target.amount,
      guests: target.guests,
      reliabilityScore: nextReliability,
      terminalMismatch: verification.terminalMismatch,
      status: target.status,
      orderType: target.orderType,
    });

    if (!verification.paymentVerified) {
      const updated = await patchOrder(orderId, {
        paymentState: verification.paymentState,
        paymentVerified: false,
        terminalMismatch: verification.terminalMismatch,
        reliabilityScore: nextReliability,
        riskLevel: nextRisk,
        protectionReason: "Terminal mismatch",
        notes: verification.reason,
      });

      if (updated) {
        await logAudit(verification.reason, "Staff", orderId);
      }

      alert(verification.reason);
      return;
    }

    if (target.depositRequired && !target.depositPaid) {
      const remainingBalance = Math.max(
        target.amount - getEffectiveDepositAmount(target),
        0
      );

      const updated = await patchOrder(orderId, {
        status: remainingBalance > 0 ? "PAYMENT_SENT" : "PAID",
        paymentStage: "FINAL",
        paymentState: "VERIFIED",
        paymentVerified: remainingBalance === 0,
        depositPaid: true,
        terminalMismatch: false,
        reliabilityScore: nextReliability,
        riskLevel: remainingBalance === 0 ? "LOW" : (target.riskLevel ?? "LOW"),
        protectionReason:
          remainingBalance > 0 ? "Deposit secured" : "Payment verified",
        notes:
          remainingBalance > 0
            ? `Deposit verified successfully. Remaining balance due: ${formatCurrency(
                remainingBalance
              )}`
            : "Deposit verified and order fully paid.",
      });

      if (updated) {
        await logAudit("Deposit verified successfully", "Staff", orderId);
      }

      alert(
        remainingBalance > 0
          ? `Deposit verified. Remaining balance: ${formatCurrency(remainingBalance)}`
          : "Payment verified successfully."
      );
      return;
    }

    const updated = await patchOrder(orderId, {
      status: "PAID",
      paymentStage: "FINAL",
      paymentState: "VERIFIED",
      paymentVerified: true,
      depositPaid: true,
      terminalMismatch: false,
      reliabilityScore: nextReliability,
      riskLevel: "LOW",
      protectionReason: "Payment verified",
      notes: "Final payment verified successfully.",
    });

    if (updated) {
      await logAudit("Final payment verified successfully", "Staff", orderId);
    }

    alert("Final payment verified successfully.");
  }

  async function sendPaymentLink(order: RestaurantOrder) {
    const amountDueNow = getAmountDueNow(order);

    const updated = await patchOrder(order.id, {
      status: "PAYMENT_SENT",
      paymentStage:
        order.depositRequired && !order.depositPaid ? "DEPOSIT" : "FINAL",
      paymentState: sendPaymentLinkTransition(),
      notes: `Payment link sent. ${getPaymentStageLabel(order)}: ${formatCurrency(
        amountDueNow
      )}`,
    });

    if (updated) {
      await logAudit("Sent payment link", "Staff", order.id);
      window.open(`/pay/${order.id}`, "_blank");
    }
  }

  async function submitPaymentScreenshot(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const updated = await patchOrder(orderId, {
      paymentState: submitScreenshotTransition(),
      notes: `Customer submitted screenshot for ${getPaymentStageLabel(target).toLowerCase()}. Manual verification required.`,
    });

    if (updated) {
      await logAudit("Marked screenshot submitted", "Staff", orderId);
    }
  }

  async function addQuickOrder() {
    if (
      !quickAdd.customerName ||
      !quickAdd.phone ||
      !quickAdd.amount ||
      !quickAdd.reservationTime
    ) {
      alert("Fill name, phone, amount, time.");
      return;
    }

    const reliabilityScore = 70;

    if (!settings) {
      alert("Settings not loaded yet.");
      return;
    }

    const depositDecision = calculateDepositDecision({
      orderType: quickAdd.orderType,
      guests: Number(quickAdd.guests),
      amount: Number(quickAdd.amount),
      reliabilityScore,
      dineInDepositGuestsThreshold: settings.dineInDepositGuestsThreshold,
      pickupDepositAmountThreshold: settings.pickupDepositAmountThreshold,
      requireDeliveryDeposit: settings.requireDeliveryDeposit,
      lowReliabilityThreshold: settings.lowReliabilityThreshold,
    });

    const depositRequired = depositDecision.required;

    const riskLevel = getRiskLevel({
      amount: Number(quickAdd.amount),
      guests: Number(quickAdd.guests),
      reliabilityScore,
      terminalMismatch: false,
      status: "UNPAID",
      orderType: quickAdd.orderType,
    });

    const protectionReason = depositRequired
      ? depositDecision.reason
      : getProtectionReason({
          depositRequired,
          reliabilityScore,
          terminalMismatch: false,
          amount: Number(quickAdd.amount),
          guests: Number(quickAdd.guests),
          orderType: quickAdd.orderType,
        });

    const newOrder: RestaurantOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerName: quickAdd.customerName,
      phone: quickAdd.phone,
      orderType: quickAdd.orderType,
      amount: Number(quickAdd.amount),
      guests: Number(quickAdd.guests),
      reservationTime: quickAdd.reservationTime,
      itemSummary: quickAdd.itemSummary || "New order",
      status: "UNPAID",
      paymentState: "PENDING",
      paymentStage: depositRequired ? "DEPOSIT" : "FINAL",
      paymentVerified: false,
      depositRequired,
      depositAmount: Number(depositDecision.depositAmount ?? 0),
      depositPaid: false,
      reliabilityScore,
      terminalMismatch: false,
      notes: "Quick-added by staff.",
      assignedStaff: quickAdd.assignedStaff,
      riskLevel,
      protectionReason,
    };

    setSaving(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create order.");
        return;
      }

      setOrders((prev) => [data, ...prev]);
      await logAudit("Created order", quickAdd.assignedStaff, data.id);

      setQuickAdd({
        customerName: "",
        phone: "",
        amount: "",
        guests: "2",
        reservationTime: "",
        itemSummary: "",
        orderType: "PREORDER_PICKUP",
        assignedStaff: "Aiman",
      });

      setQuickAddOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const metrics = useMemo(() => {
    const revenueProtected = orders
      .filter((o) => o.status === "PAID" || (o.depositRequired && o.depositPaid))
      .reduce((sum, o) => {
        if (o.status === "PAID") return sum + o.amount;
        return sum + getEffectiveDepositAmount(o);
      }, 0);

    const revenueAtRisk = orders
      .filter((o) => o.status === "UNPAID" || o.status === "PAYMENT_SENT")
      .reduce((sum, o) => sum + getAmountDueNow(o), 0);

    const blockedOrders = orders.filter((o) => isBlocked(o)).length;

    return { revenueProtected, revenueAtRisk, blockedOrders };
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "CANCELLED" && o.status !== "NO_SHOW");
  }, [orders]);

  const closedOrders = useMemo(() => {
    return orders.filter((o) => o.status === "CANCELLED" || o.status === "NO_SHOW");
  }, [orders]);

  const autopilotOrders = useMemo<AutopilotOrder[]>(() => {
    return orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      date: getStaffAutopilotDate(order.reservationTime),
      time: getStaffAutopilotTime(order.reservationTime),
      amount: getAmountDueNow(order),
      status: mapStaffStatusToAutopilotStatus(order.status),
      risk: (order.riskLevel ?? "LOW") as "LOW" | "MED" | "HIGH",
      orderType: mapStaffOrderTypeToAutopilotType(order.orderType),
      partySize: order.guests,
      reliabilityScore: order.reliabilityScore,
      depositRequired: order.depositRequired,
      depositPaid: order.depositPaid,
      paymentVerified: order.paymentVerified || order.status === "PAID",
      suspiciousPaymentScreenshot:
        order.paymentState === "SCREENSHOT_SUBMITTED" ||
        order.paymentState === "SUSPICIOUS" ||
        order.terminalMismatch,
      blocked: isBlocked(order),
    }));
  }, [orders]);

  useEffect(() => {
    evaluateOrders(autopilotOrders);
  }, [autopilotOrders, evaluateOrders]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 p-6">Loading restaurant orders...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
                  Valsentra Restaurant
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  Staff Operations
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 md:text-base">
                  Smart protection underneath, simple actions on top.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setQuickAddOpen((prev) => !prev)}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
                >
                  {quickAddOpen ? "Close Quick Add" : "Quick Add"}
                </button>

                <Link
                  href="/restaurant/owner"
                  className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
                >
                  Owner View
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <TopCard
              title="Revenue Protected"
              value={formatCurrency(metrics.revenueProtected)}
              subtitle="Deposits and paid revenue secured"
            />
            <TopCard
              title="Revenue At Risk"
              value={formatCurrency(metrics.revenueAtRisk)}
              subtitle="What is still due now"
            />
            <TopCard
              title="Blocked Orders"
              value={String(metrics.blockedOrders)}
              subtitle="Do not release yet"
            />
          </section>

          {quickAddOpen && (
            <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight">Quick Add Order</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                  placeholder="Customer name"
                  value={quickAdd.customerName}
                  onChange={(e) => setQuickAdd({ ...quickAdd, customerName: e.target.value })}
                />
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                  placeholder="Phone"
                  value={quickAdd.phone}
                  onChange={(e) => setQuickAdd({ ...quickAdd, phone: e.target.value })}
                />
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                  placeholder="Amount"
                  value={quickAdd.amount}
                  onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
                />
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                  placeholder="Guests"
                  value={quickAdd.guests}
                  onChange={(e) => setQuickAdd({ ...quickAdd, guests: e.target.value })}
                />
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500 md:col-span-2"
                  placeholder="Time"
                  value={quickAdd.reservationTime}
                  onChange={(e) => setQuickAdd({ ...quickAdd, reservationTime: e.target.value })}
                />
                <input
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500 md:col-span-2"
                  placeholder="Order summary"
                  value={quickAdd.itemSummary}
                  onChange={(e) => setQuickAdd({ ...quickAdd, itemSummary: e.target.value })}
                />
                <select
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500 md:col-span-2"
                  value={quickAdd.orderType}
                  onChange={(e) =>
                    setQuickAdd({ ...quickAdd, orderType: e.target.value as OrderType })
                  }
                >
                  <option value="DINE_IN_RESERVATION">Dine-In Reservation</option>
                  <option value="PREORDER_PICKUP">Pickup</option>
                  <option value="DELIVERY_PREORDER">Delivery</option>
                </select>
              </div>

              <button
                onClick={addQuickOrder}
                disabled={saving}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Order"}
              </button>
            </section>
          )}

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Active Orders</h2>
            </div>

            <div className="space-y-5">
              {activeOrders.map((order) => {
                const blocked = isBlocked(order);
                const reminderLink = buildWhatsAppLink(
                  order.phone,
                  `Hi ${order.customerName}, your order ${order.id} is currently ${order.status}. Please complete payment or reply if you need help.`
                );

                return (
                  <article
                    key={order.id}
                    className={`rounded-[24px] border p-5 md:p-6 ${
                      blocked ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50/50"
                    }`}
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {order.customerName}
                          </h3>

                          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
                            {order.id}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadgeClasses(
                              order.paymentState
                            )}`}
                          >
                            {order.paymentState ?? "PENDING"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClasses(
                              (order.riskLevel ?? "LOW") as RiskLevel
                            )}`}
                          >
                            {(order.riskLevel ?? "LOW")} RISK
                          </span>

                          {isBlacklisted(order.reliabilityScore) && (
                            <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white">
                              BLACKLISTED
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                          <p>
                            <span className="font-medium text-neutral-900">Time:</span>{" "}
                            {order.reservationTime}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">Type:</span>{" "}
                            {getOrderTypeLabel(order.orderType)}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">Total amount:</span>{" "}
                            {formatCurrency(order.amount)}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">
                              Deposit amount:
                            </span>{" "}
                            {formatCurrency(getEffectiveDepositAmount(order))}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">Due now:</span>{" "}
                            {formatCurrency(getAmountDueNow(order))}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">
                              Payment step:
                            </span>{" "}
                            {getPaymentStageLabel(order)}
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">
                              Reliability:
                            </span>{" "}
                            {order.reliabilityScore}%
                          </p>
                          <p>
                            <span className="font-medium text-neutral-900">Verified:</span>{" "}
                            {order.paymentVerified ? "Yes" : "No"}
                          </p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Protection
                          </p>
                          <p className={`mt-1 text-base font-semibold ${getProtectionTone(order)}`}>
                            {getProtectionStatus(order)}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {order.protectionReason || "Standard protection"}
                          </p>
                        </div>

                        {order.terminalMismatch && (
                          <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
                            Terminal mismatch detected. Expected payment does not match entered amount.
                          </div>
                        )}

                        {blocked && !order.terminalMismatch && (
                          <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
                            Do not prepare or release until the current payment step is verified.
                          </div>
                        )}
                      </div>

                      <div className="w-full lg:w-[220px]">
                        <div className="grid gap-2">
                          <button
                            onClick={() => sendPaymentLink(order)}
                            disabled={saving}
                            className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-900 disabled:opacity-50"
                          >
                            Payment Link
                          </button>

                          <button
                            type="button"
                            onClick={() => submitPaymentScreenshot(order.id)}
                            disabled={saving}
                            className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-900 disabled:opacity-50"
                          >
                            Screenshot Submitted
                          </button>

                          <a
                            href={reminderLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-900"
                            onClick={() => logAudit("Sent WhatsApp reminder", "Staff", order.id)}
                          >
                            WhatsApp Reminder
                          </a>

                          <button
                            type="button"
                            onClick={() => verifyAndMarkPaid(order.id)}
                            disabled={saving}
                            className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                          >
                            Verify Payment
                          </button>

                          <button
                            type="button"
                            onClick={() => markNoShow(order.id)}
                            disabled={saving}
                            style={{
                              backgroundColor: "#f97316",
                              color: "#ffffff",
                              padding: "12px 16px",
                              borderRadius: "16px",
                              fontSize: "14px",
                              fontWeight: 500,
                              border: "none",
                              width: "100%",
                              display: "block",
                              opacity: saving ? 0.5 : 1,
                            }}
                          >
                            No Show
                          </button>

                          <button
                            type="button"
                            onClick={() => markCancelled(order.id)}
                            disabled={saving}
                            className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Closed Orders</h2>
            </div>

            <div className="space-y-4">
              {closedOrders.length === 0 ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  No closed orders right now.
                </div>
              ) : (
                closedOrders.map((order) => {
                  const recovery = getBestWaitlistLead(order);
                  const bestLead = recovery.bestLead;

                  return (
                    <article
                      key={order.id}
                      className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 md:p-6"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{order.customerName}</h3>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-neutral-700">
                            <p>
                              <span className="font-medium text-neutral-900">
                                Cancelled order value:
                              </span>{" "}
                              {formatCurrency(order.amount)}
                            </p>
                            <p>
                              <span className="font-medium text-neutral-900">Type:</span>{" "}
                              {getOrderTypeLabel(order.orderType)}
                            </p>
                            <p>
                              <span className="font-medium text-neutral-900">Recovery:</span>{" "}
                              {bestLead
                                ? `Offer slot to ${bestLead.customerName}`
                                : "No suitable waitlist lead"}
                            </p>
                            <p>
                              <span className="font-medium text-neutral-900">
                                Recovery score:
                              </span>{" "}
                              {recovery.recoveryScore}
                            </p>
                            <p>
                              <span className="font-medium text-neutral-900">
                                Opportunity value:
                              </span>{" "}
                              {formatCurrency(recovery.recoverableRevenue)}
                            </p>
                            <p className="text-neutral-500">
                              Replacement orders are created as drafts. Staff must enter
                              the new customer’s real order value later.
                            </p>
                          </div>
                        </div>

                        {bestLead && (
                          <div className="flex flex-col gap-2 md:w-[260px]">
                            <a
                              href={buildWhatsAppLink(
                                bestLead.phone,
                                `Hi ${bestLead.customerName}, we just opened a ${getOrderTypeLabel(
                                  order.orderType
                                )} slot. Would you like it? We will confirm your actual order details after you reply.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-900"
                            >
                              Offer to Waitlist
                            </a>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => createRecoveredOrderFromLead(order, bestLead)}
                              className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                            >
                              Confirm Waitlist Fill
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TopCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
}