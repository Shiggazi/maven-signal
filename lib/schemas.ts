import { z } from "zod";
export const httpUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//.test(v), "Use an HTTP or HTTPS URL");
export const findingSchema = z.object({
  category: z.enum([
    "Pain point",
    "Buying trigger",
    "Objection",
    "Customer language",
    "Opportunity",
    "Business fact",
  ]),
  claim: z.string().min(1).max(1500),
  kind: z.enum(["observation", "inference"]),
  confidence: z.enum(["high", "medium", "low"]),
  sourceUrls: z.array(httpUrl).max(8),
});
export const reportSchema = z.object({
  summary: z.string().max(4000),
  findings: z.array(findingSchema).max(20),
  questions: z.array(z.string().max(500)).max(10),
  prospects: z
    .array(
      z.object({
        name: z.string().max(200),
        website: httpUrl,
        reason: z.string().max(1000),
      }),
    )
    .max(10),
});
export const briefSchema = z.object({
  mode: z.enum(["audience", "prospect"]),
  title: z.string().trim().min(3).max(200),
  market: z.string().max(200),
  offer: z.string().trim().min(5).max(2000),
  website: z.union([httpUrl, z.literal("")]),
  questions: z.string().max(3000),
});
export const prospectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  website: z.union([httpUrl, z.literal("")]),
  contact: z.string().max(200),
  linkedin: z.union([httpUrl, z.literal("")]),
  email: z.union([z.string().email(), z.literal("")]),
  stage: z.enum([
    "To research",
    "Researching",
    "Ready to draft",
    "Drafted",
    "Contacted",
    "Replied",
    "Archived",
  ]),
  notes: z.string().max(6000),
});
export const draftSchema = z.object({
  subject: z.string().max(180),
  body: z.string().min(1).max(5000),
  followUp: z.string().max(2500),
});
export const profileSchema = z.object({
  agency: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  offer: z.string().min(5).max(2000),
  tone: z.enum(["Friendly and direct", "Professional", "Warm and curious"]),
  cta: z.string().max(300),
});
export type Brief = z.infer<typeof briefSchema>;
export type Report = z.infer<typeof reportSchema> & {
  sources: { url: string; title: string; snippet: string }[];
  brief: Brief;
};
export type Prospect = z.infer<typeof prospectSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Draft = z.infer<typeof draftSchema> & {
  channel: "email" | "linkedin";
  prospectId: string;
  reportId: string;
  approved: boolean;
};
export type RecordItem = {
  id: string;
  kind: "report" | "prospect" | "draft" | "profile";
  title: string;
  payload: unknown;
  version: number;
  created_at: string;
  updated_at: string;
};
export const defaultProfile: Profile = {
  agency: "The Maven Digital",
  name: "Hunter",
  offer: "Conversion-focused website design and SEO for service businesses.",
  tone: "Friendly and direct",
  cta: "Would you like me to send over a few ideas?",
};
export function safeUrl(url: string) {
  try {
    return httpUrl.parse(url);
  } catch {
    return null;
  }
}
export function groundReport(
  report: z.infer<typeof reportSchema>,
  sources: Report["sources"],
) {
  const known = new Set(sources.map((s) => s.url));
  return {
    ...report,
    findings: report.findings.map((f) => {
      const urls = f.sourceUrls.filter((u) => known.has(u));
      return {
        ...f,
        sourceUrls: urls,
        kind: urls.length ? f.kind : ("inference" as const),
        confidence: urls.length ? f.confidence : ("low" as const),
      };
    }),
    prospects: report.prospects.filter((p) => known.has(p.website)),
  };
}
