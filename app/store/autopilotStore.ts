import { create } from "zustand";
import { defaultAutopilotRules } from "../lib/default-autopilot-rules";
import { buildAutopilotQueue } from "../lib/autopilotEngine";
import {
  AutopilotQueueItem,
  AutopilotRule,
  RestaurantOrder,
} from "../types/autopilot";
type AutopilotState = {
  rules: AutopilotRule[];
  queue: AutopilotQueueItem[];
  revenueSaved: number;
  setRules: (rules: AutopilotRule[]) => void;
  toggleRule: (key: AutopilotRule["key"]) => void;
  updateRuleConfig: (
    key: AutopilotRule["key"],
    config: Partial<NonNullable<AutopilotRule["config"]>>
  ) => void;
  evaluateOrders: (orders: RestaurantOrder[]) => void;
  markQueueItemDone: (id: string) => void;
  markQueueItemSkipped: (id: string) => void;
};

export const useAutopilotStore = create<AutopilotState>((set, get) => ({
  rules: defaultAutopilotRules,
  queue: [],
  revenueSaved: 0,

  setRules: (rules) => set({ rules }),

  toggleRule: (key) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.key === key ? { ...rule, enabled: !rule.enabled } : rule
      ),
    })),

  updateRuleConfig: (key, config) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.key === key
          ? {
              ...rule,
              config: {
                ...rule.config,
                ...config,
              },
            }
          : rule
      ),
    })),

  evaluateOrders: (orders) => {
    const rules = get().rules;
    const queue = buildAutopilotQueue(rules, orders);

    const revenueSaved = queue.reduce((sum: number, item: AutopilotQueueItem) => {
  return sum + (item.estimatedRevenueProtected ?? 0);
}, 0);

    set({
      queue,
      revenueSaved,
    });
  },

  markQueueItemDone: (id) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status: "DONE" } : item
      ),
    })),

  markQueueItemSkipped: (id) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status: "SKIPPED" } : item
      ),
    })),
}));