import test from "node:test";
import assert from "node:assert/strict";
import {
  groundReport,
  safeUrl,
  prospectSchema,
  briefSchema,
} from "../lib/schemas.ts";
const claim = {
  category: "Business fact" as const,
  claim: "Offers trial sessions.",
  kind: "observation" as const,
  confidence: "high" as const,
  sourceUrls: ["https://real.example/lessons", "https://invented.example/"],
};
test("retains only actually retrieved citation URLs", () => {
  const result = groundReport(
    { summary: "Report", findings: [claim], questions: [], prospects: [] },
    [
      {
        url: "https://real.example/lessons",
        title: "Lessons",
        snippet: "Trial sessions",
      },
    ],
  );
  assert.deepEqual(result.findings[0].sourceUrls, [
    "https://real.example/lessons",
  ]);
  assert.equal(result.findings[0].kind, "observation");
});
test("uncited claims cannot remain high-confidence observations", () => {
  const result = groundReport(
    { summary: "Report", findings: [claim], questions: [], prospects: [] },
    [],
  );
  assert.equal(result.findings[0].kind, "inference");
  assert.equal(result.findings[0].confidence, "low");
});
test("drops business discovery results that were not retrieved", () => {
  const result = groundReport(
    {
      summary: "Report",
      findings: [],
      questions: [],
      prospects: [
        {
          name: "Invented",
          website: "https://invented.example",
          reason: "A fit",
        },
      ],
    },
    [],
  );
  assert.equal(result.prospects.length, 0);
});
test("source links reject executable and local file schemes", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
  ])
    assert.equal(safeUrl(url), null);
  assert.equal(safeUrl("https://example.com/"), "https://example.com/");
});
test("rejects invalid contact data and pipeline values", () => {
  assert.equal(
    prospectSchema.safeParse({
      name: "Business",
      website: "https://example.com",
      contact: "",
      linkedin: "",
      email: "invented-not-an-email",
      stage: "To research",
      notes: "",
    }).success,
    false,
  );
});
test("brief bounds prevent oversized prompts", () => {
  assert.equal(
    briefSchema.safeParse({
      mode: "audience",
      title: "Baseball academies",
      market: "US",
      website: "",
      offer: "Website design",
      questions: "x".repeat(3001),
    }).success,
    false,
  );
});
