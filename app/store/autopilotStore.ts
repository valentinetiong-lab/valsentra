import { create } from "zustand";
import { defaultAutopilotRules } from "../lib/default-autopilot-rules";
import { runAutopilot } from "../lib/autopilotEngine";
import {
  AutopilotQueueItem,
  AutopilotRule,
  RestaurantOrder,
} from "../types/autopilot";

type RestaurantSettingsSync = {
  dineInDepositGuestsThreshold: number;
  pickupDepositAmountThreshold: number;
  lowReliabilityThreshold: number;
  autoBlockHighValueUnpaid: boolean;
  hardBlockTerminalMismatch: boolean;
};

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
  syncRulesFromSettings: (settings: RestaurantSettingsSync) => void;

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

  syncRulesFromSettings: (settings) =>
    set((state) => ({
      rules: state.rules.map((rule) => {
        if (rule.key === "DINE_IN_DEPOSIT_BY_GUESTS") {
          return {
            ...rule,
            config: {
              ...rule.config,
              guestThreshold: settings.dineInDepositGuestsThreshold,
            },
          };
        }

        if (rule.key === "HIGH_VALUE_DEPOSIT") {
          return {
            ...rule,
            config: {
              ...rule.config,
              amountThreshold: settings.pickupDepositAmountThreshold,
            },
          };
        }

        if (rule.key === "LOW_RELIABILITY_DEPOSIT") {
          return {
            ...rule,
            config: {
              ...rule.config,
              reliabilityThreshold: settings.lowReliabilityThreshold,
            },
          };
        }

        if (rule.key === "AUTO_BLOCK_HIGH_VALUE_UNPAID") {
          return {
            ...rule,
            enabled: settings.autoBlockHighValueUnpaid,
          };
        }

        if (rule.key === "HARD_BLOCK_TERMINAL_MISMATCH") {
          return {
            ...rule,
            enabled: settings.hardBlockTerminalMismatch,
          };
        }

        return rule;
      }),
    })),

  evaluateOrders: (orders) => {
    const { rules } = get();
    const result = runAutopilot(orders, rules);

    set({
      queue: result.queue,
      revenueSaved: result.revenueSaved,
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