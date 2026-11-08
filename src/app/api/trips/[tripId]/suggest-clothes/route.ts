import { getT } from "@/i18n/server";
import { addSuggestedClothes } from "@/lib/actions/packing-list";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const encoder = new TextEncoder();
const flushPadding = encoder.encode(`:${" ".repeat(2048)}\n\n`);

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await context.params;
  const formData = await request.formData();
  const t = await getT("packing");
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  void (async () => {
    const send = async (payload: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      await writer.write(flushPadding);
    };
    try {
      await send({ step: "open" });
      const result = await addSuggestedClothes(tripId, null, formData, async (step) => {
        await send({ step });
      });
      if (result && "error" in result && result.error) await send({ error: result.error });
      else if (result && "ok" in result && result.ok) await send({ ok: true, count: result.count ?? 0 });
      else await send({ error: t("suggest.failed") });
    } catch (error) {
      console.error("Suggest clothes failed.", error instanceof Error ? error.message : error);
      await send({ error: t("suggest.failed") });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
