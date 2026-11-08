import { neon } from "@neon/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";
import { agentLanguageRule, type Locale } from "@/i18n/config";
import {
  CLOSET_ACTIVITY_TAGS,
  CLOTHING_SLOT_LABELS,
  CLOTHING_SLOTS,
  CONDITION_TAGS,
  type ActivityTag,
  type ClothingSlot,
  type ConditionTag,
} from "@/lib/constants";

const slotList = CLOTHING_SLOTS.map((slot) => `${slot} (${CLOTHING_SLOT_LABELS[slot]})`).join(", ");

const READER_INSTRUCTIONS = `You look at one photo of a clothing item or accessory (a product shot, a store page screenshot, or a photo of the piece itself) and describe it for a traveler's closet.

- name: a short name a traveler would use, 2 to 5 words, such as "Navy merino base layer" or "Black trail runners". Include the brand only when it is clearly visible.
- description: one short sentence about material, fit, or color that helps tell it apart. Null if there is nothing useful to add.
- slot: the single best type from this list, using the most specific one that fits: ${slotList}.
- tempMin and tempMax: the outdoor range in °C the item is comfortable in, as whole numbers. For example a T-shirt 18 to 35, a fleece 0 to 15, a down jacket -15 to 5. Null when it doesn't depend on temperature, such as most accessories.
- conditions: the weather it suits, from ${CONDITION_TAGS.join(", ")}. Only tags that clearly apply; an empty list is fine.
- activities: what it is worn for, from ${CLOSET_ACTIVITY_TAGS.join(", ")}. EVERYDAY is casual wear. Only tags that clearly apply.
- goreTex: true only if a Gore-Tex label or logo is visible.
- driFit: true only if a Dri-FIT label or logo is visible.

If the image doesn't show clothing, footwear, or an accessory, set isClothing to false and leave the rest null or empty. Never guess a brand or a label you can't see.`;

const readerOutput = z.object({
  isClothing: z.boolean().describe("False when the image doesn't show a clothing item, footwear, or accessory."),
  name: z.string().nullable().describe("Short item name, or null."),
  description: z.string().nullable().describe("One short sentence, or null."),
  slot: z.string().nullable().describe("One type id from the list, or null."),
  tempMin: z.number().nullable().describe("Coolest comfortable °C, or null."),
  tempMax: z.number().nullable().describe("Warmest comfortable °C, or null."),
  conditions: z.array(z.string()).describe("Weather tags from the list."),
  activities: z.array(z.string()).describe("Activity tags from the list."),
  goreTex: z.boolean().describe("True only if a Gore-Tex label is visible."),
  driFit: z.boolean().describe("True only if a Dri-FIT label is visible."),
});

export type ClosetFacts = {
  name: string | null;
  description: string | null;
  slot: ClothingSlot | null;
  tempMin: number | null;
  tempMax: number | null;
  conditions: ConditionTag[];
  activities: ActivityTag[];
  goreTex: boolean;
  driFit: boolean;
};

export function closetReaderConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}

function cleanText(value: string | null, max: number) {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  return text ? text.slice(0, max) : null;
}

function cleanTemp(value: number | null) {
  return value != null && Number.isFinite(value) ? Math.max(-50, Math.min(50, Math.round(value))) : null;
}

/** Describe a clothing photo so the closet form can be filled in. Returns "not-clothing", or null when the reader is off or fails. */
export async function readClosetItem(
  bytes: Uint8Array,
  mediaType: string,
  locale: Locale,
): Promise<ClosetFacts | "not-clothing" | null> {
  if (!closetReaderConfigured()) return null;
  const modelId = process.env.CLOSET_AGENT_MODEL?.trim() || "gemini-3-flash";

  try {
    const { output } = await generateText({
      model: neon(modelId),
      system: `${READER_INSTRUCTIONS}\n\n${agentLanguageRule(locale, "name and description")}`,
      maxRetries: 0,
      timeout: { totalMs: 25_000 },
      output: Output.object({ schema: readerOutput }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this item." },
            { type: "file", data: bytes, mediaType },
          ],
        },
      ],
    });

    if (!output.isClothing) return "not-clothing";

    let tempMin = cleanTemp(output.tempMin);
    let tempMax = cleanTemp(output.tempMax);
    if (tempMin != null && tempMax != null && tempMax < tempMin) [tempMin, tempMax] = [tempMax, tempMin];

    return {
      name: cleanText(output.name, 80),
      description: cleanText(output.description, 300),
      slot: (CLOTHING_SLOTS as readonly string[]).includes(output.slot ?? "") ? (output.slot as ClothingSlot) : null,
      tempMin,
      tempMax,
      conditions: CONDITION_TAGS.filter((tag) => output.conditions.includes(tag)),
      activities: CLOSET_ACTIVITY_TAGS.filter((tag) => output.activities.includes(tag)),
      goreTex: output.goreTex,
      driFit: output.driFit,
    };
  } catch (error) {
    console.error("Closet reader failed.", error instanceof Error ? error.message : error);
    return null;
  }
}
