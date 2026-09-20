import { CreditLedger } from "./types";
import { STARTING_CREDITS } from "./demo-data";

export function freshCredits(): CreditLedger {
  return {
    starting: STARTING_CREDITS,
    remaining: STARTING_CREDITS,
    charged: 0,
    waivedEmpty: 0,
  };
}

/** Only debit when enrichment actually filled fields */
export function applyCharge(
  credits: CreditLedger,
  charged: number,
  wasEmpty: boolean
): CreditLedger {
  if (wasEmpty || charged <= 0) {
    return {
      ...credits,
      waivedEmpty: credits.waivedEmpty + 1,
    };
  }
  if (credits.remaining < charged) {
    throw new Error("Insufficient credits");
  }
  return {
    ...credits,
    remaining: credits.remaining - charged,
    charged: credits.charged + charged,
  };
}
