import { neon } from "@neon/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";
import { formatDate, parseDate } from "@/lib/dates";

export function documentReaderConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}

/** Read structured facts from an image or PDF. Returns null when the reader is off or fails. */
export async function readFileWithModel<Schema extends z.ZodType>({
  instructions,
  prompt,
  schema,
  bytes,
  mediaType,
}: {
  instructions: string;
  prompt: string;
  schema: Schema;
  bytes: Uint8Array;
  mediaType: string;
}): Promise<z.infer<Schema> | null> {
  if (!documentReaderConfigured()) return null;
  const modelId = process.env.DOCUMENT_AGENT_MODEL?.trim() || "gemini-3-flash";

  try {
    const { output } = await generateText({
      model: neon(modelId),
      system: instructions,
      maxRetries: 0,
      timeout: { totalMs: 25_000 },
      output: Output.object({ schema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: bytes, mediaType },
          ],
        },
      ],
    });
    return output as z.infer<Schema>;
  } catch (error) {
    console.error("Document reader failed.", error instanceof Error ? error.message : error);
    return null;
  }
}

export function cleanReadDate(value: string | null) {
  const date = value ? parseDate(value.trim()) : null;
  return date ? formatDate(date) : null;
}

export function cleanReadName(value: string | null) {
  const name = value?.replace(/\s+/g, " ").trim() ?? "";
  return name && name.length <= 120 ? name : null;
}

export function cleanReadNumber(value: string | null) {
  const number = value?.replace(/\s+/g, "").trim() ?? "";
  return number && number.length <= 40 ? number : null;
}

const READER_INSTRUCTIONS = `You read one travel or identity document (passport, ID card, driver's license, visa, or similar) from an image or PDF and copy four facts from it.

- fullName: the holder's full name as printed in the visual zone, given names first and then the surname (for example "Maria Elena Garcia Lopez"). When the document prints the name in more than one language, use the English (Latin-letter) version exactly as printed. When the name is printed in only one language, keep it in that language and script (for example Hebrew, Arabic, Greek or Cyrillic): never translate or transliterate it yourself. Keep accents, and in scripts with capital letters use normal capitalization rather than ALL CAPS. Read the name from the machine-readable zone only when the visual zone is unreadable (surname before "<<", given names after, "<" between words).
- documentNumber: the document's own number, exactly as printed, without spaces. For a passport or ID card, use the document number, not a personal/national ID number. For a visa, use the visa number or control number.
- issuedOn: the date of issue, as YYYY-MM-DD.
- expiresOn: the date of expiry (valid until), as YYYY-MM-DD.

Convert any printed date format to YYYY-MM-DD, including the machine-readable zone and other languages and calendars. Use null for anything that isn't printed, is unreadable, or that you aren't sure of. Never guess.`;

const readerOutput = z.object({
  fullName: z.string().nullable().describe("Holder's full name, given names first: the English version when printed in several languages, otherwise as printed. Or null."),
  documentNumber: z.string().nullable().describe("Document number as printed, or null."),
  issuedOn: z.string().nullable().describe("Issue date as YYYY-MM-DD, or null."),
  expiresOn: z.string().nullable().describe("Expiry date as YYYY-MM-DD, or null."),
});

export type DocumentFacts = {
  fullName: string | null;
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
};

/** Read the holder's name, number and dates from a document image or PDF. Returns null when the reader is off or fails. */
export async function readDocumentFacts(bytes: Uint8Array, mediaType: string): Promise<DocumentFacts | null> {
  const output = await readFileWithModel({
    instructions: READER_INSTRUCTIONS,
    prompt: "Read this document.",
    schema: readerOutput,
    bytes,
    mediaType,
  });
  if (!output) return null;

  const facts = {
    fullName: cleanReadName(output.fullName),
    documentNumber: cleanReadNumber(output.documentNumber),
    issuedOn: cleanReadDate(output.issuedOn),
    expiresOn: cleanReadDate(output.expiresOn),
  };
  // A reading with expiry before issue is wrong somewhere; keep the number and drop both dates.
  if (facts.issuedOn && facts.expiresOn && facts.expiresOn < facts.issuedOn) {
    return { ...facts, issuedOn: null, expiresOn: null };
  }
  return facts;
}
