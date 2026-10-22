import { z } from "zod";
import { authorize, body, failure, json, HttpError } from "@/lib/api";
import { draftSchema, profileSchema, prospectSchema } from "@/lib/schemas";
export async function GET() {
  try {
    const { db } = await authorize();
    const { data, error } = await db
      .from("records")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error)
      throw new HttpError(
        503,
        "Saved records are unavailable. Check the database migration.",
      );
    return json({ records: data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const { db, user } = await authorize(req);
    const input = z
      .object({
        id: z.string().uuid().optional(),
        kind: z.enum(["prospect", "draft", "profile"]),
        title: z.string().min(1).max(200),
        payload: z.unknown(),
        version: z.number().int().positive().optional(),
      })
      .parse(await body(req));
    let payload: unknown;
    if (input.kind === "prospect")
      payload = prospectSchema.parse(input.payload);
    else if (input.kind === "profile")
      payload = profileSchema.parse(input.payload);
    else {
      if (!input.id)
        throw new HttpError(400, "Generate a draft from research first.");
      payload = draftSchema
        .extend({
          channel: z.enum(["email", "linkedin"]),
          prospectId: z.string().uuid(),
          reportId: z.string().uuid(),
          approved: z.boolean(),
        })
        .parse(input.payload);
    }
    if (input.id && !input.version)
      throw new HttpError(400, "Record version required.");
    const record = {
      title: input.title,
      kind: input.kind,
      payload,
      updated_at: new Date().toISOString(),
    };
    const query = input.id
      ? db
          .from("records")
          .update({ ...record, version: input.version! + 1 })
          .eq("id", input.id)
          .eq("owner_id", user.id)
          .eq("kind", input.kind)
          .eq("version", input.version!)
      : db.from("records").insert({ ...record, owner_id: user.id });
    const { data, error } = await query.select().maybeSingle();
    if (error) throw new HttpError(503, "Could not save this record.");
    if (!data)
      throw new HttpError(
        409,
        "This record changed in another tab. Refresh before saving.",
      );
    return json({ record: data });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    const { db, user } = await authorize(req);
    const { id } = z.object({ id: z.string().uuid() }).parse(await body(req));
    const { error } = await db
      .from("records")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw new Error("Delete failed");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
