"use client";

import { AutopilotQueueItem } from "../types/autopilot";
import { useAutopilotStore } from "../store/autopilotStore";

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

function handleAutopilotAction(item: AutopilotQueueItem) {
  if (item.action === "SEND_PAYMENT_LINK") {
    const message = `Hi ${item.customerName}, to confirm your order, please complete the deposit/payment here: [PAYMENT LINK]. Thank you.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    return;
  }

  if (item.action === "OFFER_WAITLIST") {
    alert("Offer this slot to waitlist customers.");
    return;
  }

  if (item.action === "BLOCK_ORDER") {
    alert("Order has been blocked.");
    return;
  }

  if (item.action === "FLAG_FRAUD") {
    alert("Fraud alert flagged. Manager approval required.");
    return;
  }

  if (item.action === "REDUCE_RELIABILITY") {
    alert("Customer reliability should be reduced.");
    return;
  }

  if (item.action === "SEND_REMINDER") {
    alert("Reminder should be sent.");
    return;
  }

  if (item.action === "RELEASE_SLOT") {
    alert("Slot should be released.");
    return;
  }

  if (item.action === "REQUIRE_DEPOSIT") {
    alert("Deposit is required before confirmation.");
  }
}

export default function AutopilotQueuePanel() {
  const { queue, markQueueItemDone, markQueueItemSkipped, revenueSaved } =
    useAutopilotStore();

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
                    onClick={() => {
                      handleAutopilotAction(item);
                      markQueueItemDone(item.id);
                    }}
                    className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white"
                  >
                    Execute
                  </button>

                  <button
                    onClick={() => markQueueItemSkipped(item.id)}
                    className="rounded-lg bg-gray-200 px-3 py-1 text-sm"
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