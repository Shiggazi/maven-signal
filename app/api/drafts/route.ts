import { z } from "zod";
import { authorize, body, failure, json, quota, HttpError } from "@/lib/api";
import { compose, aiModel } from "@/lib/ai";
import {
  prospectSchema,
  profileSchema,
  defaultProfile,
  reportSchema,
  type Report,
} from "@/lib/schemas";
export const maxDuration = 90;
export async function POST(req: Request) {
  try {
    const { db, user } = await authorize(req);
    const input = z
      .object({
        requestId: z.string().uuid(),
        prospectId: z.string().uuid(),
        reportId: z.string().uuid(),
        findingIndices: z.array(z.number().int().min(0)).min(1).max(5),
        channel: z.enum(["email", "linkedin"]),
      })
      .parse(await body(req));
    const { data: rows, error } = await db
      .from("records")
      .select("*")
      .eq("owner_id", user.id)
      .in("id", [input.prospectId, input.reportId]);
    if (error) throw new Error("Load failed");
    const p = rows?.find(
      (x) => x.id === input.prospectId && x.kind === "prospect",
    );
    const r = rows?.find((x) => x.id === input.reportId && x.kind === "report");
    if (!p || !r)
      throw new HttpError(404, "Select a saved prospect and research report.");
    const report = reportSchema.parse(r.payload);
    const evidence = [...new Set(input.findingIndices)].map(
      (i) => report.findings[i],
    );
    if (
      evidence.some(
        (f) => !f || f.kind !== "observation" || !f.sourceUrls.length,
      )
    )
      throw new HttpError(
        400,
        "Drafts require sourced observations that you have reviewed.",
      );
    const { data: profiles, error: profileError } = await db
      .from("records")
      .select("payload")
      .eq("owner_id", user.id)
      .eq("kind", "profile")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (profileError) throw new Error("Profile load failed");
    const profile = profiles?.length
      ? profileSchema.parse(profiles[0].payload)
      : defaultProfile;
    const prospect = prospectSchema.parse(p.payload);
    const raw = r.payload as Report;
    if (raw.brief.mode !== "prospect")
      throw new HttpError(
        400,
        "Research this business first. Audience-wide findings cannot be treated as facts about an individual prospect.",
      );
    if (
      !prospect.website ||
      !raw.brief.website ||
      new URL(prospect.website).hostname.replace(/^www\./, "") !==
        new URL(raw.brief.website).hostname.replace(/^www\./, "")
    )
      throw new HttpError(
        400,
        "Choose a prospect research report for this business website.",
      );
    aiModel();
    await quota(db, input.requestId);
    const draft = await compose(profile, prospect, evidence, input.channel);
    const { data, error: saveError } = await db
      .from("records")
      .insert({
        id: input.requestId,
        owner_id: user.id,
        kind: "draft",
        title: `${prospect.name} · ${input.channel}`,
        payload: {
          ...draft,
          channel: input.channel,
          prospectId: input.prospectId,
          reportId: input.reportId,
          approved: false,
        },
      })
      .select()
      .single();
    if (saveError)
      throw new HttpError(503, "Draft generated but saving failed.");
    return json({ record: data });
  } catch (e) {
    return failure(e);
  }
}
