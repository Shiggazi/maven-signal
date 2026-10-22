import { z } from "zod";
import { authorize, body, failure, json, quota, HttpError } from "@/lib/api";
import { briefSchema } from "@/lib/schemas";
import { research, aiModel } from "@/lib/ai";
export const maxDuration = 300;
export async function POST(req: Request) {
  try {
    const { db, user } = await authorize(req);
    const input = briefSchema
      .extend({ requestId: z.string().uuid() })
      .parse(await body(req));
    if (input.mode === "prospect" && !input.website)
      throw new HttpError(
        400,
        "A business website is required for prospect research.",
      );
    aiModel();
    await quota(db, input.requestId);
    const payload = await research(input);
    const { data, error } = await db
      .from("records")
      .insert({
        id: input.requestId,
        owner_id: user.id,
        kind: "report",
        title: input.title,
        payload,
      })
      .select()
      .single();
    if (error)
      throw new HttpError(
        503,
        "Research completed but saving failed. Check database availability.",
      );
    return json({ record: data });
  } catch (e) {
    return failure(e);
  }
}
