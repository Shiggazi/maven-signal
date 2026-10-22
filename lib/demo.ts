import type { RecordItem, Report, Prospect, Draft } from "./schemas";
const date = "2026-10-22T09:00:00Z";
const make = (
  id: string,
  kind: RecordItem["kind"],
  title: string,
  payload: unknown,
): RecordItem => ({
  id,
  kind,
  title,
  payload,
  version: 1,
  created_at: date,
  updated_at: date,
});
export const demoRecords: RecordItem[] = [
  make("demo-report", "report", "Independent baseball academies", {
    brief: {
      mode: "audience",
      title: "Independent baseball academies",
      market: "United States",
      offer: "Website design and SEO",
      website: "",
      questions: "What makes parents choose a training program?",
    },
    summary:
      "Illustrative research: parents choosing a training academy may value clear age groups, coach experience, and an easy path to booking a trial. These are example findings, not live market research.",
    findings: [
      {
        category: "Pain point",
        claim:
          "Parents may struggle to compare training programs when age groups, session formats, and prices are unclear.",
        kind: "inference",
        confidence: "low",
        sourceUrls: [],
      },
      {
        category: "Buying trigger",
        claim:
          "Opening a second training location could create a need for clearer local pages and booking options.",
        kind: "inference",
        confidence: "low",
        sourceUrls: [],
      },
      {
        category: "Objection",
        claim:
          "An owner may already receive enough referrals and question whether a website project will bring additional value.",
        kind: "inference",
        confidence: "low",
        sourceUrls: [],
      },
      {
        category: "Opportunity",
        claim:
          "A trial-session page could answer parents’ practical questions before they enquire.",
        kind: "inference",
        confidence: "low",
        sourceUrls: [],
      },
    ],
    questions: [
      "Which academies currently accept trial bookings online?",
      "What do parents mention in actual reviews?",
      "Who manages marketing decisions?",
    ],
    sources: [],
    prospects: [],
  } satisfies Report),
  make("demo-prospect", "prospect", "Northfield Baseball Academy", {
    name: "Northfield Baseball Academy",
    website: "https://example.com",
    contact: "Alex",
    linkedin: "",
    email: "",
    stage: "To research",
    notes:
      "Fictional business for exploring the interface. Research a real business before writing outreach.",
  } satisfies Prospect),
  make("demo-draft", "draft", "Northfield · email", {
    subject: "A question about trial sessions",
    body: "Hi Alex,\n\nI help training businesses make their websites easier for parents to use.\n\nHow do you currently handle enquiries about trial sessions at Northfield?\n\nIf it would be useful, I can share a few ideas for explaining the next step clearly on your website.\n\nHunter",
    followUp:
      "Hi Alex, just following up on my question about trial sessions. Happy to share a few ideas if improving the enquiry process is on your list.",
    channel: "email",
    prospectId: "demo-prospect",
    reportId: "demo-report",
    approved: false,
  } satisfies Draft),
];
