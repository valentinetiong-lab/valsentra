type DepositDecisionInput = {
  orderType: "DINE_IN_RESERVATION" | "PREORDER_PICKUP" | "DELIVERY_PREORDER";
  guests: number;
  amount: number;
  reliabilityScore: number;
  dineInDepositGuestsThreshold: number;
  pickupDepositAmountThreshold: number;
  requireDeliveryDeposit: boolean;
  lowReliabilityThreshold: number;
};

export type DepositDecision = {
  required: boolean;
  depositAmount: number;
  reason: string;
};

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateDepositDecision(
  input: DepositDecisionInput
): DepositDecision {
  let required = false;
  let reason = "No deposit required";

  if (
    input.orderType === "DINE_IN_RESERVATION" &&
    input.guests >= input.dineInDepositGuestsThreshold
  ) {
    required = true;
    reason = "Large dine-in booking";
  }

  if (
    input.orderType === "PREORDER_PICKUP" &&
    input.amount >= input.pickupDepositAmountThreshold
  ) {
    required = true;
    reason = "High-value pickup order";
  }

  if (
    input.orderType === "DELIVERY_PREORDER" &&
    input.requireDeliveryDeposit
  ) {
    required = true;
    reason = "Delivery orders require deposit";
  }

  if (input.reliabilityScore <= input.lowReliabilityThreshold) {
    required = true;
    reason = "Low reliability customer";
  }

  const depositAmount = required ? roundToTwo(input.amount * 0.3) : 0;

  return {
    required,
    depositAmount,
    reason,
  };
}