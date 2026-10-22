# Maven Signal

A private agency workspace for audience research, prospect research, and personalized LinkedIn/email drafts. Built with Next.js, TypeScript, Supabase, and the Vercel AI SDK. Source belongs in this repository; deployment target is Vercel.

## What is implemented

- Audience and individual-business research briefs, multi-query web search and page retrieval through Vercel AI Gateway.
- Structured reports with observations, inferences, confidence, linked sources, unanswered questions, and business suggestions.
- Citation URL validation against actual tool results. Unretrieved citation URLs are removed; unsupported observations become low-confidence inferences. This checks provenance, not the truth of every statement. Human source review remains necessary.
- Prospect CRUD, contact fields, pipeline stages, search and filters.
- Email and LinkedIn direct-message drafting from selected sourced observations about the same business website. Audience findings cannot be used as individual-business facts.
- Editable drafts and follow-ups, review state, copy and text export. No messages are sent.
- Agency voice/offer settings and JSON workspace export.
- Supabase password sign-in, invitation-only email allowlist, row-level data isolation, origin checks, input validation, optimistic concurrency on edits, and an atomic 20-request UTC daily AI cap per user.
- Responsive dark interface and an explicitly fictional `/demo` experience. Demo edits exist in memory only and never call AI or a database.

## Setup

### 1. Connect Supabase

Create a Supabase project (the Vercel Marketplace integration is suitable). Run `supabase/migrations/001_initial.sql` **once** in a new project's SQL editor. This creates records, row-level policies and the atomic quota function. Do not rerun the initial migration against an existing deployment; add future numbered migrations.

In Supabase Authentication, disable public sign-ups. Create the agency owner's email/password account in the dashboard. Set the site's URL to the final Vercel URL. The app intentionally has no public registration or billing flow.

### 2. Configure Vercel

Import `Shiggazi/maven-signal` as a **new** Vercel project, using the Next.js preset, repository root directory, Node.js 22 or later, `npm ci` installation, and `npm run build`.

Add these environment variables to the intended deployment environment:

| Variable                               | Purpose                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (or legacy anon key), never a service-role key                                                       |
| `AGENCY_ALLOWED_EMAILS`                | Comma-separated email addresses allowed to enter the private agency workspace. Empty means no access.                         |
| `AI_GATEWAY_MODEL`                     | A current tool-capable Gateway model ID. `anthropic/claude-sonnet-5.5` was present in the live catalog during implementation. |
| `AI_GATEWAY_API_KEY`                   | For local development or non-OIDC environments only. Vercel deployment OIDC is supported automatically by the AI SDK.         |

Enable AI Gateway for the same Vercel team, check its credits and set a suitable project budget. Research uses Perplexity search and Browserbase page retrieval through Gateway; no separate LinkedIn or email integration is needed. Provider and search usage can incur charges. No paid plan is provisioned by this repository.

Redeploy after changing environment values. Public Supabase values are built into the client bundle. Keep secrets in Vercel environment settings and ignored `.env.local`, never in Git or chat.

When Supabase is missing, `/` displays a setup screen. The app fails closed: private data and AI endpoints remain unavailable. The `/demo` page remains accessible with clearly labeled fictional data. Once configured, `/` requires a valid invited account.

### 3. Local development

Use Node.js 22.13 or later. Copy `.env.example` to `.env.local`, fill in the values securely, and use an AI Gateway API key for local AI calls. Do not copy production user data into a shared development environment.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

### 4. First real workflow

1. Sign in and save your agency offer, sender name, tone and preferred next step in Settings.
2. Research a niche and market. Review the linked source context; treat inferences as questions to validate.
3. Add a real prospect with its website, then run **Business research** for that website.
4. In Draft studio, select the prospect and matching business report. Select up to five sourced observations you have reviewed.
5. Generate an email or LinkedIn DM. Edit it, mark it reviewed, save it and copy it into your own outreach workflow.
6. Update the prospect's stage manually as conversations progress.

## Architecture

- `app/api/research`: authenticated, quota-limited research and report persistence.
- `app/api/drafts`: retrieves the user's saved records, enforces business/report matching, then generates and saves a draft.
- `app/api/records`: validated CRUD with user-scoped queries and version checks.
- `lib/ai.ts`: bounded AI SDK calls and tool-result source extraction. Model output is rendered as text, never raw HTML.
- `lib/supabase`: cookie-based SSR/browser clients; `proxy.ts` refreshes authentication.
- `supabase/migrations`: database schema and RLS policies. No service-role key is used.
- `components/workspace.tsx`: workspace UI. `lib/demo.ts` contains fictional examples only.

## Verification and limitations

TypeScript checking, a production build, and focused tests for citation grounding, unsupported prospects, URL safety and input bounds are available through the scripts above. Live Supabase, Gateway, account isolation and deployment must be verified against configured services. Building successfully does not establish that credentials, provider credits, migrations or team permissions work.

Research is bounded to seven model steps and a four-minute timeout, with a five-minute Vercel route maximum. It is web-grounded research, not an exhaustive crawl, visual audit, analytics assessment, or a guarantee of factual accuracy. Failed AI attempts count toward the daily request cap. No automatic retries are used. Repeating a request ID cannot consume AI twice. Drafting uses a one-minute model timeout.

The workspace loads up to 500 recent records. Export currently includes those loaded records. This is an agency MVP, not a finished commercial SaaS: before paid launch add paginated history, workspace/team memberships, billing and plan enforcement, background research jobs, a usage dashboard, account lifecycle/recovery UI, and production monitoring. The current owner-based row isolation is a foundation for these features, not a claim that team sharing or subscriptions already exist.

Do not use the demo for real client records. Protect downloaded exports as private business information. Deleting a report/prospect does not cascade to other saved records; old drafts remain available for review but new drafts need a current prospect and report.
