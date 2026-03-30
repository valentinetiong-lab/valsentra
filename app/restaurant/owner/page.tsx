"use client";

import Link from "next/link";
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

type RiskLevel = "LOW" | "MED" | "HIGH";

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
  riskLevel?: RiskLevel;
  protectionReason?: string;
  createdAt?: string;
};

type AuditItem = {
  id: number | string;
  action: string;
  staff: string;
  orderId: string;
  createdAt?: string;
};

type RestaurantSettings = {
  id: number;
  dineInDepositGuestsThreshold: number;
  pickupDepositAmountThreshold: number;
  requireDeliveryDeposit: boolean;
  lowReliabilityThreshold: number;
  autoBlockHighValueUnpaid: boolean;
  hardBlockTerminalMismatch: boolean;
  updatedAt?: string;
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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function riskBadgeClasses(level: RiskLevel) {
  if (level === "HIGH") return "bg-red-100 text-red-700 border-red-200";
  if (level === "MED") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export default function RestaurantOwnerPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        await Promise.all([loadOrders(), loadAudit(), loadSettings(), loadWaitlist()]);
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

  async function loadAudit() {
    const res = await fetch("/api/audit", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setAudit(data);
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

  function isBlacklisted(score: number) {
    return score <= 10;
  }

  function requiresProtection(order: RestaurantOrder) {
    if (!settings) return order.depositRequired;

    if (
      order.orderType === "DINE_IN_RESERVATION" &&
      order.guests >= settings.dineInDepositGuestsThreshold
    ) {
      return true;
    }

    if (
      order.orderType === "PREORDER_PICKUP" &&
      order.amount >= settings.pickupDepositAmountThreshold
    ) {
      return true;
    }

    if (
      order.orderType === "DELIVERY_PREORDER" &&
      settings.requireDeliveryDeposit
    ) {
      return true;
    }

    if (order.reliabilityScore <= settings.lowReliabilityThreshold) {
      return true;
    }

    return order.depositRequired;
  }

  function isBlocked(order: RestaurantOrder) {
    if (!settings) return false;
    if (order.status === "PAID") return false;
    if (order.status === "CANCELLED" || order.status === "NO_SHOW") return false;
    if (settings.hardBlockTerminalMismatch && order.terminalMismatch) return true;
    if (order.depositRequired && !order.depositPaid) return true;
    if (settings.autoBlockHighValueUnpaid && requiresProtection(order)) return true;
    if (isBlacklisted(order.reliabilityScore)) return true;
    return false;
  }

  async function saveSettings(next: Partial<RestaurantSettings>) {
    if (!settings) return;

    const previous = settings;
    const optimistic = { ...settings, ...next };
    setSettings(optimistic);
    setSavingSettings(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save settings.");
        setSettings(previous);
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error(error);
      alert("Failed to save settings.");
      setSettings(previous);
    } finally {
      setSavingSettings(false);
    }
  }

  const metrics = useMemo(() => {
    const revenueProtected = orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + o.amount, 0);

    const revenueAtRisk = orders
      .filter((o) => o.status === "UNPAID" || o.status === "PAYMENT_SENT")
      .reduce((sum, o) => sum + o.amount, 0);

    const noShowLoss = orders
      .filter((o) => o.status === "NO_SHOW")
      .reduce((sum, o) => sum + o.amount, 0);

    const preventedLoss = orders
      .filter((o) => isBlocked(o) && o.status !== "PAID")
      .reduce((sum, o) => sum + o.amount, 0);

    const blockedOrders = orders.filter((o) => isBlocked(o)).length;
    const recoveredOpportunities = orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "NO_SHOW"
    ).length;

    const recoveryScore =
      revenueProtected + revenueAtRisk + noShowLoss === 0
        ? 0
        : Math.round(
            (revenueProtected / (revenueProtected + revenueAtRisk + noShowLoss)) * 100
          );

    return {
      revenueProtected,
      revenueAtRisk,
      noShowLoss,
      preventedLoss,
      blockedOrders,
      recoveredOpportunities,
      recoveryScore,
    };
  }, [orders, settings]);

  const fraudAlerts = useMemo(() => {
    return orders.filter(
      (order) =>
        order.terminalMismatch ||
        order.reliabilityScore <= 20 ||
        isBlacklisted(order.reliabilityScore) ||
        (order.riskLevel ?? "LOW") === "HIGH"
    );
  }, [orders]);

  const dailyRiskReport = useMemo(() => {
    const highRisk = orders.filter((o) => (o.riskLevel ?? "LOW") === "HIGH").length;
    const mediumRisk = orders.filter((o) => (o.riskLevel ?? "LOW") === "MED").length;
    const unpaid = orders.filter(
      (o) => o.status === "UNPAID" || o.status === "PAYMENT_SENT"
    ).length;

    return { highRisk, mediumRisk, unpaid };
  }, [orders]);

  const autopilotAlerts = useMemo(() => {
    return orders
      .filter((o) => o.status !== "PAID" && o.status !== "CANCELLED")
      .map((order) => {
        if (order.terminalMismatch) {
          return {
            orderId: order.id,
            title: "Hard block release",
            reason: "Terminal mismatch detected. Staff must not release this order.",
          };
        }

        if (order.depositRequired && !order.depositPaid) {
          return {
            orderId: order.id,
            title: "Deposit pending",
            reason: "Deposit or payment is still pending before confirmation.",
          };
        }

        if ((order.riskLevel ?? "LOW") === "HIGH") {
          return {
            orderId: order.id,
            title: "High risk order",
            reason:
              order.protectionReason || "High-risk order needs strict protection.",
          };
        }

        if (requiresProtection(order) && order.status !== "PAID") {
          return {
            orderId: order.id,
            title: "Protection rule triggered",
            reason:
              "This order matches owner protection rules and should stay blocked until verified.",
          };
        }

        return {
          orderId: order.id,
          title: "Monitor order",
          reason: "Order is active and still needs operational attention.",
        };
      });
  }, [orders, settings]);

  const customerProfiles = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        bookings: number;
        completed: number;
        noShows: number;
        cancelled: number;
        reliabilityScore: number;
      }
    >();

    for (const order of orders) {
      const existing = map.get(order.phone) ?? {
        name: order.customerName,
        phone: order.phone,
        bookings: 0,
        completed: 0,
        noShows: 0,
        cancelled: 0,
        reliabilityScore: order.reliabilityScore,
      };

      existing.bookings += 1;
      if (order.status === "PAID") existing.completed += 1;
      if (order.status === "NO_SHOW") existing.noShows += 1;
      if (order.status === "CANCELLED") existing.cancelled += 1;
      existing.reliabilityScore = order.reliabilityScore;

      map.set(order.phone, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => a.reliabilityScore - b.reliabilityScore
    );
  }, [orders]);

  if (loading || !settings) {
    return <div className="min-h-screen bg-neutral-50 p-6">Loading owner dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
                  Valsentra Restaurant
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  Owner Control Center
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 md:text-base">
                  Revenue protection, fraud alerts, reliability, waitlist recovery,
                  autopilot monitoring, and daily risk in one place.
                </p>
              </div>

              <Link
                href="/restaurant"
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
              >
                Back to Staff View
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              title="Revenue Protected"
              value={formatCurrency(metrics.revenueProtected)}
              subtitle="Already secured"
            />
            <MetricCard
              title="Revenue At Risk"
              value={formatCurrency(metrics.revenueAtRisk)}
              subtitle="Still exposed"
            />
            <MetricCard
              title="No-Show Loss"
              value={formatCurrency(metrics.noShowLoss)}
              subtitle="Lost from no-shows"
            />
            <MetricCard
              title="Prevented Loss"
              value={formatCurrency(metrics.preventedLoss)}
              subtitle="Risk currently blocked"
            />
            <MetricCard
              title="Blocked Orders"
              value={String(metrics.blockedOrders)}
              subtitle="Protection enforced"
            />
            <MetricCard
              title="Recovery Score"
              value={`${metrics.recoveryScore}/100`}
              subtitle="Current defense quality"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Rules Engine</h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Define how the restaurant protects itself.
                  </p>
                </div>
                {savingSettings && (
                  <span className="text-xs text-neutral-500">Saving...</span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RuleInput
                  label="Dine-in deposit starts at (guests)"
                  value={settings.dineInDepositGuestsThreshold}
                  onCommit={(value) =>
                    saveSettings({ dineInDepositGuestsThreshold: Number(value) })
                  }
                />
                <RuleInput
                  label="Pickup deposit starts at (RM)"
                  value={settings.pickupDepositAmountThreshold}
                  onCommit={(value) =>
                    saveSettings({ pickupDepositAmountThreshold: Number(value) })
                  }
                />
                <RuleInput
                  label="Low reliability threshold"
                  value={settings.lowReliabilityThreshold}
                  onCommit={(value) =>
                    saveSettings({ lowReliabilityThreshold: Number(value) })
                  }
                />
              </div>

              <div className="mt-5 space-y-3">
                <RuleToggle
                  label="Require delivery deposit"
                  checked={settings.requireDeliveryDeposit}
                  onChange={(checked) =>
                    saveSettings({ requireDeliveryDeposit: checked })
                  }
                />
                <RuleToggle
                  label="Auto-block high-value unpaid orders"
                  checked={settings.autoBlockHighValueUnpaid}
                  onChange={(checked) =>
                    saveSettings({ autoBlockHighValueUnpaid: checked })
                  }
                />
                <RuleToggle
                  label="Hard block terminal mismatch"
                  checked={settings.hardBlockTerminalMismatch}
                  onChange={(checked) =>
                    saveSettings({ hardBlockTerminalMismatch: checked })
                  }
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight">Daily Risk Report</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  What needs attention today.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MiniStat title="High Risk" value={String(dailyRiskReport.highRisk)} />
                <MiniStat title="Medium Risk" value={String(dailyRiskReport.mediumRisk)} />
                <MiniStat title="Unpaid" value={String(dailyRiskReport.unpaid)} />
              </div>

              <div className="mt-5 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p>
                  <span className="font-medium text-neutral-900">
                    Revenue protected today:
                  </span>{" "}
                  {formatCurrency(metrics.revenueProtected)}
                </p>
                <p className="mt-2">
                  <span className="font-medium text-neutral-900">
                    Revenue at risk today:
                  </span>{" "}
                  {formatCurrency(metrics.revenueAtRisk)}
                </p>
                <p className="mt-2">
                  <span className="font-medium text-neutral-900">
                    Recovery opportunities:
                  </span>{" "}
                  {metrics.recoveredOpportunities}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Fraud / Risk Alerts</h2>
            </div>

            <div className="space-y-4">
              {fraudAlerts.length === 0 ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  No major fraud alerts right now.
                </div>
              ) : (
                fraudAlerts.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[22px] border border-red-200 bg-red-50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{order.id}</p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClasses(
                          (order.riskLevel ?? "LOW") as RiskLevel
                        )}`}
                      >
                        {(order.riskLevel ?? "LOW")} RISK
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-neutral-700">
                      <p>
                        <span className="font-medium text-neutral-900">Customer:</span>{" "}
                        {order.customerName}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-900">Type:</span>{" "}
                        {getOrderTypeLabel(order.orderType)}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-900">Amount:</span>{" "}
                        {formatCurrency(order.amount)}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-900">
                          Protection reason:
                        </span>{" "}
                        {order.protectionReason || "Standard protection"}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Autopilot Queue</h2>
              <p className="mt-2 text-sm text-neutral-600">
                What Valsentra is watching automatically in the background.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {autopilotAlerts.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  No autopilot items right now.
                </div>
              ) : (
                autopilotAlerts.map((alert) => (
                  <article
                    key={`${alert.orderId}-${alert.title}`}
                    className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">{alert.orderId}</p>
                    <p className="mt-3 text-sm text-neutral-700">{alert.reason}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">
                Customer Reliability
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {customerProfiles.map((profile) => (
                <article
                  key={profile.phone}
                  className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{profile.name}</p>
                    {isBlacklisted(profile.reliabilityScore) && (
                      <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white">
                        BLACKLISTED
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-neutral-700">
                    <p>
                      <span className="font-medium text-neutral-900">Phone:</span>{" "}
                      {profile.phone}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Bookings:</span>{" "}
                      {profile.bookings}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Completed:</span>{" "}
                      {profile.completed}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">No-shows:</span>{" "}
                      {profile.noShows}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Cancelled:</span>{" "}
                      {profile.cancelled}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Reliability:</span>{" "}
                      {profile.reliabilityScore}%
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Waitlist Recovery</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {waitlist.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="font-semibold">{lead.customerName}</p>
                  <div className="mt-3 space-y-1 text-sm text-neutral-700">
                    <p>
                      <span className="font-medium text-neutral-900">Type:</span>{" "}
                      {getOrderTypeLabel(lead.preferredType)}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">
                        Show probability:
                      </span>{" "}
                      {lead.showProbability}%
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">
                        Response speed:
                      </span>{" "}
                      {lead.responseSpeedScore}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">
                        Reliability:
                      </span>{" "}
                      {lead.reliabilityScore}%
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Recent Orders</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Quick owner view of the latest operational activity.
              </p>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  No orders yet.
                </div>
              ) : (
                orders.slice(0, 8).map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {order.id} • {getOrderTypeLabel(order.orderType)} •{" "}
                          {order.reservationTime}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClasses(
                            (order.riskLevel ?? "LOW") as RiskLevel
                          )}`}
                        >
                          {(order.riskLevel ?? "LOW")} RISK
                        </span>

                        <div className="text-sm text-neutral-700">
                          <p className="font-medium">{formatCurrency(order.amount)}</p>
                          <p>{order.status}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">Audit Log</h2>
            </div>

            <div className="space-y-3">
              {audit.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  No audit items yet.
                </div>
              ) : (
                audit.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <p className="font-semibold">{item.action}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {item.staff} • {item.orderId}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
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

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function RuleInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  return (
    <label className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <p className="font-medium text-neutral-900">{label}</p>
      <input
        type="number"
        className="mt-3 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-500"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onCommit(localValue)}
      />
    </label>
  );
}

function RuleToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}