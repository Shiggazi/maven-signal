import { Radar, ArrowUpRight, ShieldCheck } from "lucide-react";
export default function Setup({ denied = false }: { denied?: boolean }) {
  return (
    <main className="setup">
      <a className="brand" href="/">
        <span className="brandmark">
          <Radar size={24} />
        </span>
        Maven<span>Signal</span>
      </a>
      <span className="eyebrow">YOUR RESEARCH WORKSPACE</span>
      <h1>
        Better research.
        <br />
        <em>Better conversations.</em>
      </h1>
      <p>
        {denied
          ? "This private workspace is invitation-only. Ask the owner to add your email to the agency allowlist."
          : "Maven Signal is built. Connect your database and sign-in to start researching real businesses and saving your work."}
      </p>
      <div className="setup-card">
        <ShieldCheck />
        <div>
          <h3>
            {denied ? "Access required" : "Complete your workspace setup"}
          </h3>
          <p>
            {denied
              ? "The workspace remains private to the agency."
              : "The repository README includes the Supabase migration, Vercel environment variables, and account setup steps. Live research stays disabled until these are configured."}
          </p>
        </div>
      </div>
      <div className="actions">
        <a className="button primary" href="/demo">
          Explore the demo <ArrowUpRight size={16} />
        </a>
        <a
          className="button"
          href="https://github.com/Shiggazi/maven-signal"
          target="_blank"
          rel="noreferrer"
        >
          View source code
        </a>
      </div>
      <small>Demo content is fictional. No messages are sent.</small>
    </main>
  );
}
