import { z } from "zod";
import { CURRENCIES, INSURANCE_TYPES } from "@/lib/constants";
import { cleanReadDate, cleanReadNumber, readFileWithModel } from "@/lib/document-reader";

const POLICY_INSTRUCTIONS = `You read one insurance policy, certificate of insurance, or insurance confirmation from an image or PDF and copy facts from it.

- provider: the insurance company that issues the policy (not an agent, broker, or bank), as printed.
- type: TRAVEL for travel insurance (trip medical, baggage, delays), HEALTH for health or medical insurance that isn't sold for a trip, CANCEL for cancellation or interruption cover only, OTHER for anything else.
- policyNumber: the policy or certificate number, exactly as printed, without spaces.
- startDate: the first day of cover, as YYYY-MM-DD.
- endDate: the last day of cover, as YYYY-MM-DD.
- insuredName: the full name of the insured traveler. When several people are insured, use the first one listed.
- premium: the total price paid for the policy, as a plain number without symbols or thousands separators.
- currency: the ISO 4217 code of the premium, such as USD, EUR, or ILS.

Convert any printed date format to YYYY-MM-DD, including other languages and calendars. Use null for anything that isn't printed, is unreadable, or that you aren't sure of. Never guess. Never use a coverage limit, deductible, or excess as the premium.`;

const policyOutput = z.object({
  provider: z.string().nullable().describe("Insurance company name, or null."),
  type: z.enum(INSURANCE_TYPES).nullable().describe("Kind of policy, or null."),
  policyNumber: z.string().nullable().describe("Policy number as printed, or null."),
  startDate: z.string().nullable().describe("First day of cover as YYYY-MM-DD, or null."),
  endDate: z.string().nullable().describe("Last day of cover as YYYY-MM-DD, or null."),
  insuredName: z.string().nullable().describe("Full name of the insured traveler, or null."),
  premium: z.number().nullable().describe("Total price paid, or null."),
  currency: z.string().nullable().describe("ISO 4217 code of the premium, or null."),
});

export type PolicyFacts = {
  provider: string | null;
  type: (typeof INSURANCE_TYPES)[number] | null;
  policyNumber: string | null;
  startDate: string | null;
  endDate: string | null;
  insuredName: string | null;
  amount: string | null;
  currency: string | null;
};

/** Read the insurer, coverage, insured traveler, and price from a policy image or PDF. */
export async function readPolicyFacts(bytes: Uint8Array, mediaType: string): Promise<PolicyFacts | null> {
  const output = await readFileWithModel({
    instructions: POLICY_INSTRUCTIONS,
    prompt: "Read this insurance policy.",
    schema: policyOutput,
    bytes,
    mediaType,
  });
  if (!output) return null;

  const provider = output.provider?.trim().slice(0, 120) || null;
  const insuredName = output.insuredName?.trim().slice(0, 120) || null;
  let startDate = cleanReadDate(output.startDate);
  let endDate = cleanReadDate(output.endDate);
  // Cover that ends before it starts was misread somewhere; drop both dates.
  if (startDate && endDate && endDate < startDate) {
    startDate = null;
    endDate = null;
  }

  // A price is only useful with a currency the app supports.
  const currency = output.currency?.trim().toUpperCase() ?? "";
  const knownCurrency = (CURRENCIES as readonly string[]).includes(currency) ? currency : null;
  const premium = output.premium;
  const amount =
    knownCurrency && premium !== null && Number.isFinite(premium) && premium > 0 ? String(Math.round(premium * 100) / 100) : null;

  return {
    provider,
    type: output.type,
    policyNumber: cleanReadNumber(output.policyNumber),
    startDate,
    endDate,
    insuredName,
    amount,
    currency: amount ? knownCurrency : null,
  };
}
