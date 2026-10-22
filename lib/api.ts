import { z } from "zod";
import { serverClient, permitted } from "./supabase/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function authorize(req?: Request) {
  if (req && req.method !== "GET") {
    const origin = req.headers.get("origin");
    if (!origin || origin !== new URL(req.url).origin)
      throw new HttpError(403, "Request origin is not allowed.");
  }
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Please sign in again.");
  if (!permitted(user.email))
    throw new HttpError(
      403,
      "This workspace is invitation-only. Ask the owner to add your email.",
    );
  return { db, user };
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function failure(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  if (e instanceof z.ZodError)
    return json({ error: e.issues[0]?.message || "Invalid input." }, 400);
  if (e instanceof Error && e.message === "SETUP_REQUIRED")
    return json(
      {
        error:
          "Connect Supabase in Vercel to enable sign-in and saved research.",
      },
      503,
    );
  console.error("Request failed", e instanceof Error ? e.name : "UnknownError");
  return json(
    {
      error:
        "The request could not be completed. Check the service configuration and try again. Existing records have not been changed.",
    },
    502,
  );
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length")) > 50000)
    throw new HttpError(413, "Request too large.");
  const text = await req.text();
  if (text.length > 50000) throw new HttpError(413, "Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export async function quota(
  db: Awaited<ReturnType<typeof serverClient>>,
  id: string,
) {
  const { data, error } = await db.rpc("claim_ai_request", { request_id: id });
  if (error)
    throw new HttpError(
      503,
      "Apply the database migration before running research.",
    );
  if (!data)
    throw new HttpError(
      429,
      "This request already ran, or your daily limit of 20 AI requests has been reached.",
    );
}
