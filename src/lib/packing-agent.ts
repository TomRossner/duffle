import { neon } from "@neon/ai-sdk-provider";
import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { agentLanguageRule, type Locale } from "@/i18n/config";
import { slotLabel } from "@/lib/constants";
import {
  applyPackingPicks,
  closetForPrompt,
  type PackingClosetItem,
  type PackingDayContext,
  type PackingSuggestion,
} from "@/lib/packing";

const PACKING_INSTRUCTIONS = `You pack one traveler's bag from their own closet.

Call packClothes once with the clothes to bring. Use only closet item ids from the closet list. If the tool reports an error, call it again with a corrected list.

Decide for the whole trip, using the forecast, the plans, and the rule draft as a starting point:
- Bring enough tops to cover the days without packing the entire closet. Rewear is fine on a short trip. A closet item's quantity is the most you can pack of that exact piece; choose other tops when one is not enough.
- Reuse bottoms, shoes, and jackets across days. Add a second pair of shoes only when the plans need it, such as a hike and a dinner.
- Add an outer layer for cold, rain, snow, or wind. Layer a base, mid layer, and shell when the day is cold or the temperatures swing. Prefer Gore-Tex when it will rain, and Dri-Fit for sport or heat.
- Add swimwear for a beach plan, and formal clothes for a dinner plan.
- Add an accessory for strong sun, rain, or snow.
- dates are the YYYY-MM-DD trip days that item is worn.
- reason is one short sentence a traveler would understand, naming the weather or the plan.`;

const packClothesInput = z.object({
  items: z
    .array(
      z.object({
        closetItemId: z.string().describe("Id copied from the closet list."),
        quantity: z.number().int().min(1).max(99).describe("How many to pack, at most the closet quantity."),
        dates: z.array(z.string()).describe("Trip dates this item is worn, as YYYY-MM-DD."),
        reason: z.string().describe("One short sentence explaining why to pack it."),
      }),
    )
    .min(1)
    .max(30),
});

export function packingAgentConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}

export async function suggestPackingWithAgent(
  items: PackingClosetItem[],
  days: PackingDayContext[],
  ruleSuggestions: PackingSuggestion[],
  locale: Locale,
): Promise<PackingSuggestion[] | null> {
  if (!packingAgentConfigured() || items.length === 0 || days.length === 0) return null;
  const closet = closetForPrompt(items, days);
  if (closet.length === 0) return null;

  try {
    const suggestions = await runPackingAgent(closet, days, ruleSuggestions, locale);
    return suggestions.length > 0 ? suggestions : null;
  } catch (error) {
    console.error(
      "Packing agent failed, using the scored list.",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function runPackingAgent(
  closet: PackingClosetItem[],
  days: PackingDayContext[],
  ruleSuggestions: PackingSuggestion[],
  locale: Locale,
) {
  const allowed = new Set(closet.map((item) => item.id));
  let packed: PackingSuggestion[] = [];
  const modelId = process.env.PACKING_AGENT_MODEL?.trim() || "gemini-3-flash";

  const agent = new ToolLoopAgent({
    id: "packing",
    model: neon(modelId),
    instructions: `${PACKING_INSTRUCTIONS}\n\n${agentLanguageRule(locale, "each reason")}`,
    maxRetries: 0,
    toolChoice: "required",
    stopWhen: ({ steps }) => {
      if (steps.length >= 3) return true;
      const last = steps[steps.length - 1];
      return last?.toolResults.some((result) => result.toolName === "packClothes" && packAccepted(result.output)) ?? false;
    },
    tools: {
      packClothes: tool({
        description: "Save the clothes to pack. Only closet item ids from the closet list are accepted.",
        inputSchema: packClothesInput,
        execute: async ({ items: picks }) => {
          const unknown = [...new Set(picks.map((pick) => pick.closetItemId).filter((id) => !allowed.has(id)))];
          if (unknown.length > 0) {
            return {
              ok: false as const,
              error: `Unknown closet item ids: ${unknown.join(", ")}. Use only ids from the closet list.`,
            };
          }
          const suggestions = applyPackingPicks(picks, closet, days);
          if (suggestions.length === 0) {
            return { ok: false as const, error: "Nothing in that list can be packed. Choose ids from the closet list." };
          }
          packed = suggestions;
          return { ok: true as const, count: new Set(suggestions.map((suggestion) => suggestion.closetItemId)).size };
        },
      }),
    },
  });

  await agent.generate({
    prompt: JSON.stringify({
      closet: closet.map(closetEntry),
      days: days.map(dayEntry),
      ruleDraft: ruleDraft(ruleSuggestions, allowed),
    }),
    timeout: { totalMs: 25_000 },
  });

  return packed;
}

function packAccepted(output: unknown): output is { ok: true } {
  return typeof output === "object" && output !== null && "ok" in output && output.ok === true;
}

function closetEntry(item: PackingClosetItem) {
  return {
    id: item.id,
    name: item.name,
    ...(item.description ? { description: item.description.slice(0, 240) } : {}),
    slot: slotLabel(item.slot),
    quantity: item.quantity ?? 1,
    ...(item.tempMin != null ? { tempMinC: item.tempMin } : {}),
    ...(item.tempMax != null ? { tempMaxC: item.tempMax } : {}),
    ...(item.conditions.length > 0 ? { weather: item.conditions } : {}),
    ...(item.activities.length > 0 ? { activities: item.activities } : {}),
    ...(item.goreTex ? { goreTex: true } : {}),
    ...(item.driFit ? { driFit: true } : {}),
  };
}

function dayEntry(day: PackingDayContext) {
  return {
    date: day.date,
    ...(day.place ? { place: day.place } : {}),
    tempMinC: day.tempMin,
    tempMaxC: day.tempMax,
    precipitationMm: day.precipitation,
    windSpeed: day.windSpeed,
    condition: day.condition,
    activities: day.activityTags,
    ...(day.plans && day.plans.length > 0 ? { plans: day.plans.slice(0, 8).map((plan) => plan.slice(0, 80)) } : {}),
  };
}

function ruleDraft(suggestions: PackingSuggestion[], allowed: Set<string>) {
  const grouped = new Map<string, { dates: string[]; reason: string }>();
  for (const suggestion of suggestions) {
    if (!allowed.has(suggestion.closetItemId)) continue;
    const current = grouped.get(suggestion.closetItemId);
    if (!current) {
      grouped.set(suggestion.closetItemId, { dates: [suggestion.date], reason: suggestion.reason });
      continue;
    }
    current.dates.push(suggestion.date);
  }
  return [...grouped.entries()].map(([closetItemId, value]) => ({ closetItemId, ...value }));
}
