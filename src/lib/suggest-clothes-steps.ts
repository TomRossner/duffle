export const SUGGEST_CLOTHES_STEPS = ["forecast", "match", "choose", "save"] as const;

export type SuggestClothesStep = (typeof SUGGEST_CLOTHES_STEPS)[number];

export const SUGGEST_CLOTHES_STEP_LABELS: Record<SuggestClothesStep, string> = {
  forecast: "Reading the forecast",
  match: "Matching your closet",
  choose: "Choosing clothes",
  save: "Saving to your bag",
};

export function isSuggestClothesStep(value: unknown): value is SuggestClothesStep {
  return typeof value === "string" && (SUGGEST_CLOTHES_STEPS as readonly string[]).includes(value);
}
