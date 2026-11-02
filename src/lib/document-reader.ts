import { neon } from "@neon/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";
import { formatDate, parseDate } from "@/lib/dates";

const READER_INSTRUCTIONS = `You read one travel or identity document (passport, ID card, driver's license, visa, or similar) from an image or PDF and copy three facts from it.

- documentNumber: the document's own number, exactly as printed, without spaces. For a passport or ID card, use the document number, not a personal/national ID number. For a visa, use the visa number or control number.
- issuedOn: the date of issue, as YYYY-MM-DD.
- expiresOn: the date of expiry (valid until), as YYYY-MM-DD.

Convert any printed date format to YYYY-MM-DD, including the machine-readable zone and other languages and calendars. Use null for anything that isn't printed, is unreadable, or that you aren't sure of. Never guess.`;

const readerOutput = z.object({
  documentNumber: z.string().nullable().describe("Document number as printed, or null."),
  issuedOn: z.string().nullable().describe("Issue date as YYYY-MM-DD, or null."),
  expiresOn: z.string().nullable().describe("Expiry date as YYYY-MM-DD, or null."),
});

export type DocumentFacts = {
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
};

export function documentReaderConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}

function cleanDate(value: string | null) {
  const date = value ? parseDate(value.trim()) : null;
  return date ? formatDate(date) : null;
}

function cleanNumber(value: string | null) {
  const number = value?.replace(/\s+/g, "").trim() ?? "";
  return number && number.length <= 40 ? number : null;
}

/** Read the number and dates from a document image or PDF. Returns null when the reader is off or fails. */
export async function readDocumentFacts(bytes: Uint8Array, mediaType: string): Promise<DocumentFacts | null> {
  if (!documentReaderConfigured()) return null;
  const modelId = process.env.DOCUMENT_AGENT_MODEL?.trim() || "gemini-3-flash";

  try {
    const { output } = await generateText({
      model: neon(modelId),
      system: READER_INSTRUCTIONS,
      maxRetries: 0,
      timeout: { totalMs: 25_000 },
      output: Output.object({ schema: readerOutput }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this document." },
            { type: "file", data: bytes, mediaType },
          ],
        },
      ],
    });

    const facts = {
      documentNumber: cleanNumber(output.documentNumber),
      issuedOn: cleanDate(output.issuedOn),
      expiresOn: cleanDate(output.expiresOn),
    };
    // A reading with expiry before issue is wrong somewhere; keep the number and drop both dates.
    if (facts.issuedOn && facts.expiresOn && facts.expiresOn < facts.issuedOn) {
      return { ...facts, issuedOn: null, expiresOn: null };
    }
    return facts;
  } catch (error) {
    console.error("Document reader failed.", error instanceof Error ? error.message : error);
    return null;
  }
}
