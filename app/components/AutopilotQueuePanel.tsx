"use client";

import { useAutopilotStore } from "../store/autopilotStore";

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
              <div className="font-medium">{item.customerName}</div>
              <div className="text-sm text-gray-500">
                {item.action} • {item.reason}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {item.status === "QUEUED" ? (
                <>
                  <button
                    onClick={() => markQueueItemDone(item.id)}
                    className="rounded-lg bg-green-500 px-3 py-1 text-sm text-white"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => markQueueItemSkipped(item.id)}
                    className="rounded-lg bg-gray-300 px-3 py-1 text-sm"
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