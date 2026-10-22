"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  Radar,
  LayoutDashboard,
  ScanSearch,
  Users,
  PenLine,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  ChevronRight,
  Globe,
  Link as LinkIcon,
  Check,
  Copy,
  Download,
  Trash2,
  X,
  LoaderCircle,
  Mail,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  LogOut,
  BookOpen,
  Target,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  defaultProfile,
  safeUrl,
  type Brief,
  type Report,
  type Prospect,
  type Draft,
  type Profile,
  type RecordItem,
} from "@/lib/schemas";
import { demoRecords } from "@/lib/demo";
import { browserClient } from "@/lib/supabase/browser";
type Tab = "Overview" | "Research" | "Prospects" | "Draft studio" | "Settings";
const icons = {
  Overview: LayoutDashboard,
  Research: ScanSearch,
  Prospects: Users,
  "Draft studio": PenLine,
  Settings,
};
const emptyProspect: Prospect = {
  name: "",
  website: "",
  contact: "",
  linkedin: "",
  email: "",
  stage: "To research",
  notes: "",
};
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
function Blank({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="blank">
      <div className="blank-icon">
        <Radar size={27} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function External({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return safeUrl(url) ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={13} />
    </a>
  ) : (
    <span>{children}</span>
  );
}
export default function Workspace({
  demo = false,
  email,
}: {
  demo?: boolean;
  email: string;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [records, setRecords] = useState<RecordItem[]>(demo ? demoRecords : []);
  const [loading, setLoading] = useState(!demo);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [newBrief, setNewBrief] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [brief, setBrief] = useState<Brief>({
    mode: "audience",
    title: "",
    market: "United States",
    offer: defaultProfile.offer,
    website: "",
    questions: "",
  });
  const [prospectForm, setProspectForm] = useState<Prospect | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [stage, setStage] = useState("All stages");
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null);
  const [selectedProspect, setSelectedProspect] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [checked, setChecked] = useState<number[]>([]);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [draftEdit, setDraftEdit] = useState<Draft | null>(null);
  const modalOpen = !!prospectForm || !!deleteTarget;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(
      "[role=dialog], [role=alertdialog]",
    );
    const selector =
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]";
    dialog?.querySelector<HTMLElement>(selector)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProspectForm(null);
        setDeleteTarget(null);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(selector) || [],
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [modalOpen]);
  const reports = records.filter((r) => r.kind === "report");
  const prospects = records.filter((r) => r.kind === "prospect");
  const drafts = records.filter((r) => r.kind === "draft");
  const reportRecord = reports.find((r) => r.id === activeReport);
  const report = reportRecord?.payload as Report | undefined;
  const draftRecord = drafts.find((r) => r.id === currentDraft);
  const linkedReport = reports.find((r) => r.id === selectedReport)?.payload as
    Report | undefined;
  async function api(path: string, method = "GET", payload?: unknown) {
    const res = await fetch(path, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const { records: rows } = await api("/api/records");
      setRecords(rows);
      const p = rows.find((r: RecordItem) => r.kind === "profile");
      if (p) setProfile(p.payload);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!demo) void reload();
  }, []); // Initial authenticated load only.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  function upsert(r: RecordItem) {
    setRecords((old) => [r, ...old.filter((x) => x.id !== r.id)]);
  }
  async function save(
    kind: RecordItem["kind"],
    title: string,
    payload: unknown,
    existing?: RecordItem,
  ) {
    setError("");
    if (demo) {
      const r = {
        id: existing?.id || crypto.randomUUID(),
        kind,
        title,
        payload,
        version: (existing?.version || 0) + 1,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      upsert(r);
      setNotice("Updated in demo. Changes reset when you leave.");
      return r;
    }
    const { record } = await api("/api/records", "POST", {
      kind,
      title,
      payload,
      id: existing?.id,
      version: existing?.version,
    });
    upsert(record);
    setNotice("Saved to your workspace.");
    return record;
  }
  function startBrief(mode: Brief["mode"] = "audience", p?: Prospect) {
    setTab("Research");
    setActiveReport(null);
    setNewBrief(true);
    setBrief({
      mode,
      title: p?.name || "",
      website: p?.website || "",
      market: "United States",
      offer: profile.offer,
      questions: "",
    });
  }
  async function runResearch(e: FormEvent) {
    e.preventDefault();
    if (demo) {
      setError(
        "Live research is unavailable in the demo. Connect your workspace to research real businesses.",
      );
      return;
    }
    setBusy("research");
    setError("");
    try {
      const { record } = await api("/api/research", "POST", {
        ...brief,
        requestId: crypto.randomUUID(),
      });
      upsert(record);
      setActiveReport(record.id);
      setNewBrief(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function saveProspect(e: FormEvent) {
    e.preventDefault();
    if (!prospectForm) return;
    setBusy("save");
    try {
      await save(
        "prospect",
        prospectForm.name,
        prospectForm,
        editing || undefined,
      );
      setProspectForm(null);
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function generateDraft() {
    if (demo) {
      setError(
        "AI drafting is disabled in the demo. You can open and edit the example draft below.",
      );
      return;
    }
    setBusy("draft");
    setError("");
    try {
      const { record } = await api("/api/drafts", "POST", {
        requestId: crypto.randomUUID(),
        prospectId: selectedProspect,
        reportId: selectedReport,
        findingIndices: checked,
        channel,
      });
      upsert(record);
      openDraft(record);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function openDraft(r: RecordItem) {
    setCurrentDraft(r.id);
    setDraftEdit({ ...(r.payload as Draft) });
    setTab("Draft studio");
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
    } catch {
      setError(
        "Clipboard access is unavailable. Select the draft text and copy it manually.",
      );
    }
  }
  function download(name: string, text: string, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportData() {
    download(
      "maven-signal-export.json",
      JSON.stringify(
        { exportedAt: new Date().toISOString(), records },
        null,
        2,
      ),
      "application/json",
    );
  }
  const filteredProspects = prospects.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) &&
      (stage === "All stages" || (r.payload as Prospect).stage === stage),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar" inert={modalOpen}>
        <a href={demo ? "/demo" : "/"} className="brand">
          <span className="brandmark">
            <Radar size={22} />
          </span>
          Maven<span>Signal</span>
        </a>
        <div className="workspace-pill">
          <span className="workspace-avatar">M</span>
          <div>
            The Maven Digital<small>Agency workspace</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {(Object.keys(icons) as Tab[]).map((t) => {
            const Icon = icons[t];
            return (
              <button
                key={t}
                className={tab === t ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setTab(t);
                  setSearch("");
                  setError("");
                }}
              >
                <Icon size={18} />
                {t}
                {t === "Draft studio" && drafts.length > 0 && (
                  <span className="nav-count">{drafts.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="side-note">
          <span className="tiny-dot" /> Research first. Reach out second.
          <p>Every good conversation starts with understanding.</p>
        </div>
        <div className="account">
          <span className="avatar">{demo ? "D" : "H"}</span>
          <div>
            {demo ? "Demo visitor" : "Agency member"}
            <small title={email}>{email}</small>
          </div>
          {!demo && (
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await browserClient().auth.signOut();
                  window.location.href = "/login";
                } catch {
                  setError("Sign-out failed. Please try again.");
                }
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
      <div className="main-shell" inert={modalOpen}>
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={14} />
            <span>{tab}</span>
          </div>
          <div>
            <span className="private">
              <ShieldCheck size={14} />
              {demo ? "Demo mode" : "Private workspace"}
            </span>
            <span className="avatar small">{demo ? "D" : "H"}</span>
          </div>
        </header>
        <main className="content">
          {demo && (
            <div className="demo-banner">
              <BookOpen size={16} />
              <span>
                Interactive demo · All businesses and findings are fictional.
                Changes are temporary.
              </span>
              <a href="/">
                Workspace setup <ArrowUpRight size={14} />
              </a>
            </div>
          )}
          {error && (
            <div role="alert" className="error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {tab === "Overview" ? "THE MAVEN DIGITAL" : "YOUR WORKSPACE"}
              </div>
              <h1>
                {tab === "Overview"
                  ? "Find the signal. Start a conversation."
                  : tab === "Research"
                    ? "Research that goes deeper."
                    : tab === "Prospects"
                      ? "Your next good-fit client."
                      : tab === "Draft studio"
                        ? "Make the first message count."
                        : "Make it sound like you."}
              </h1>
              <p>
                {tab === "Overview"
                  ? "Turn audience insights into thoughtful, relevant outreach."
                  : tab === "Research"
                    ? "Understand the market. Get specific about the business. Keep the evidence."
                    : tab === "Prospects"
                      ? "A focused list of businesses worth understanding."
                      : tab === "Draft studio"
                        ? "Grounded in your research. Written for a real person. Reviewed by you."
                        : "Your offer and voice guide every outreach draft."}
              </p>
            </div>
            {tab !== "Settings" && (
              <button
                className="primary"
                onClick={() =>
                  tab === "Prospects"
                    ? (setEditing(null), setProspectForm({ ...emptyProspect }))
                    : startBrief()
                }
              >
                <Plus size={17} />
                {tab === "Prospects" ? "Add prospect" : "New research"}
              </button>
            )}
          </div>
          {loading ? (
            <div className="blank">
              <LoaderCircle className="spin" />
              <p>Loading your workspace…</p>
            </div>
          ) : (
            <>
              {tab === "Overview" && (
                <>
                  <div className="stats">
                    {[
                      [
                        ScanSearch,
                        "Research reports",
                        reports.length,
                        "Saved market & business research",
                      ],
                      [
                        Users,
                        "Prospects",
                        prospects.length,
                        "Businesses in your pipeline",
                      ],
                      [
                        PenLine,
                        "Outreach drafts",
                        drafts.length,
                        "Ready for your review",
                      ],
                    ].map(([Icon, label, count, sub]) => {
                      const I = Icon as typeof Radar;
                      return (
                        <div className="stat" key={String(label)}>
                          <span>
                            {String(label)}
                            <I size={18} />
                          </span>
                          <strong>{String(count).padStart(2, "0")}</strong>
                          <small>{String(sub)}</small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="overview-grid">
                    <section className="hero-card">
                      <div className="eyebrow">START WITH UNDERSTANDING</div>
                      <h2>
                        Your next client starts
                        <br />
                        with a better question.
                      </h2>
                      <p>
                        Explore a niche, uncover what matters to buyers, and
                        find a relevant reason to reach out.
                      </p>
                      <button className="primary" onClick={() => startBrief()}>
                        Research an audience <ArrowRight size={16} />
                      </button>
                      <div className="radar-art" aria-hidden="true">
                        <div />
                        <div />
                        <div />
                        <span />
                        <i />
                        <b />
                      </div>
                    </section>
                    <section className="panel workflow">
                      <div className="section-heading">
                        <h3>From insight to outreach</h3>
                        <span className="tag">3 steps</span>
                      </div>
                      {[
                        [
                          "01",
                          "Understand the audience",
                          "Pain points, buying triggers, objections.",
                        ],
                        [
                          "02",
                          "Research the business",
                          "Specific facts, sources, and opportunities.",
                        ],
                        [
                          "03",
                          "Write with context",
                          "A relevant email or LinkedIn draft.",
                        ],
                      ].map(([n, t, d]) => (
                        <div className="workflow-step" key={n}>
                          <span>{n}</span>
                          <div>
                            <h4>{t}</h4>
                            <p>{d}</p>
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>
                  <section className="panel">
                    <div className="section-heading">
                      <div>
                        <h3>Recent research</h3>
                        <p>
                          Your latest starting points for better conversations.
                        </p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setTab("Research")}
                      >
                        View all <ArrowRight size={15} />
                      </button>
                    </div>
                    {reports.length ? (
                      reports.slice(0, 4).map((r) => (
                        <button
                          className="report-row"
                          key={r.id}
                          onClick={() => {
                            setActiveReport(r.id);
                            setNewBrief(false);
                            setTab("Research");
                          }}
                        >
                          <span className="row-icon">
                            <ScanSearch size={20} />
                          </span>
                          <div>
                            <strong>{r.title}</strong>
                            <small>
                              {(r.payload as Report).brief.mode === "audience"
                                ? "Audience research"
                                : "Business research"}{" "}
                              · {(r.payload as Report).sources.length} sources
                            </small>
                          </div>
                          <span className="tag">
                            {demo ? "Example" : "Saved"}
                          </span>
                          <ArrowUpRight size={17} />
                        </button>
                      ))
                    ) : (
                      <Blank
                        title="Your first insight is one brief away."
                        text="Choose a niche and tell Maven Signal what you offer."
                        action={
                          <button onClick={() => startBrief()}>
                            Create research brief <ArrowRight size={15} />
                          </button>
                        }
                      />
                    )}
                  </section>
                  <div className="bottom-note">
                    <ShieldCheck size={15} />
                    Drafts only. You decide what gets sent, when, and to whom.
                  </div>
                </>
              )}
              {tab === "Research" && (
                <>
                  {newBrief ? (
                    <section className="panel form-panel">
                      <div className="section-heading">
                        <h3>New research brief</h3>
                        <button
                          className="icon-button"
                          aria-label="Close research brief"
                          onClick={() => setNewBrief(false)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <form onSubmit={runResearch}>
                        <div className="segmented">
                          <button
                            type="button"
                            className={
                              brief.mode === "audience" ? "selected" : ""
                            }
                            onClick={() =>
                              setBrief({ ...brief, mode: "audience" })
                            }
                          >
                            <Users size={17} />
                            Audience research
                          </button>
                          <button
                            type="button"
                            className={
                              brief.mode === "prospect" ? "selected" : ""
                            }
                            onClick={() =>
                              setBrief({ ...brief, mode: "prospect" })
                            }
                          >
                            <Target size={17} />
                            Business research
                          </button>
                        </div>
                        <div className="field-grid">
                          <Field
                            label={
                              brief.mode === "audience"
                                ? "Target audience or niche"
                                : "Business name"
                            }
                          >
                            <input
                              required
                              minLength={3}
                              maxLength={200}
                              value={brief.title}
                              onChange={(e) =>
                                setBrief({ ...brief, title: e.target.value })
                              }
                              placeholder={
                                brief.mode === "audience"
                                  ? "e.g. Independent baseball academies"
                                  : "e.g. Business name"
                              }
                            />
                          </Field>
                          <Field label="Target market">
                            <input
                              value={brief.market}
                              maxLength={200}
                              onChange={(e) =>
                                setBrief({ ...brief, market: e.target.value })
                              }
                              placeholder="Location or market"
                            />
                          </Field>
                        </div>
                        {brief.mode === "prospect" && (
                          <Field label="Business website">
                            <input
                              required
                              type="url"
                              value={brief.website}
                              onChange={(e) =>
                                setBrief({ ...brief, website: e.target.value })
                              }
                              placeholder="https://business.com"
                            />
                          </Field>
                        )}
                        <Field label="What do you offer this audience?">
                          <textarea
                            required
                            minLength={5}
                            maxLength={2000}
                            value={brief.offer}
                            onChange={(e) =>
                              setBrief({ ...brief, offer: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Questions to investigate (optional)">
                          <textarea
                            maxLength={3000}
                            value={brief.questions}
                            onChange={(e) =>
                              setBrief({ ...brief, questions: e.target.value })
                            }
                            placeholder="What drives their buying decisions? How do customers book? What objections come up?"
                          />
                        </Field>
                        <div className="research-scope">
                          <Globe size={18} />
                          <div>
                            <strong>
                              Public web research with linked evidence
                            </strong>
                            <p>
                              Findings include confidence, unanswered questions,
                              and a clear distinction between observations and
                              inferences.
                            </p>
                          </div>
                        </div>
                        <div className="form-footer">
                          <small>
                            {busy === "research"
                              ? "Searching public sources and building your report. This can take a few minutes."
                              : "One research run uses one of your 20 daily AI requests. Provider usage charges may apply."}
                          </small>
                          <button className="primary" disabled={!!busy}>
                            {busy === "research" ? (
                              <LoaderCircle className="spin" size={17} />
                            ) : (
                              <ScanSearch size={17} />
                            )}{" "}
                            {busy === "research"
                              ? "Researching…"
                              : "Run research"}
                          </button>
                        </div>
                      </form>
                    </section>
                  ) : report && reportRecord ? (
                    <>
                      <div className="actions report-actions">
                        <button onClick={() => setActiveReport(null)}>
                          ← All research
                        </button>
                        <button
                          onClick={() =>
                            download(
                              "research-report.json",
                              JSON.stringify(report, null, 2),
                              "application/json",
                            )
                          }
                        >
                          <Download size={15} />
                          Export report
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Delete report"
                          onClick={() => setDeleteTarget(reportRecord)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <section className="panel">
                        <div className="section-heading">
                          <span className="tag purple">
                            {report.brief.mode === "audience"
                              ? "Audience research"
                              : "Business research"}
                          </span>
                          <small>{reportRecord.updated_at.slice(0, 10)}</small>
                        </div>
                        <h2>{reportRecord.title}</h2>
                        <p className="summary">{report.summary}</p>
                        <div className="report-meta">
                          <span>
                            <Globe size={14} />
                            {report.brief.market || "Market not specified"}
                          </span>
                          <span>
                            <LinkIcon size={14} />
                            {report.sources.length} sources
                          </span>
                          <span>{report.findings.length} findings</span>
                        </div>
                      </section>
                      <div className="section-heading spaced">
                        <h3>What the research found</h3>
                        <small>
                          Review source context before using an observation.
                        </small>
                      </div>
                      <div className="findings-grid">
                        {report.findings.map((f, i) => (
                          <article className="panel finding" key={i}>
                            <div className="section-heading">
                              <span className="eyebrow">{f.category}</span>
                              <span
                                className={
                                  "tag " +
                                  (f.kind === "observation" ? "green" : "amber")
                                }
                              >
                                {f.kind === "observation"
                                  ? "Observation"
                                  : "Inference"}
                              </span>
                            </div>
                            <p>{f.claim}</p>
                            <div className="finding-bottom">
                              <small>{f.confidence} confidence</small>
                              <div>
                                {f.sourceUrls.map((url, j) => (
                                  <External key={url} url={url}>
                                    Source {j + 1}
                                  </External>
                                ))}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <div className="two-col spaced">
                        <section className="panel">
                          <h3>Questions still worth asking</h3>
                          {report.questions.map((q) => (
                            <p className="question" key={q}>
                              <span>?</span>
                              {q}
                            </p>
                          ))}
                        </section>
                        <section className="panel">
                          <h3>Source notebook</h3>
                          {report.sources.length ? (
                            report.sources.map((s, i) => (
                              <div className="source" key={s.url}>
                                <span>{String(i + 1).padStart(2, "0")}</span>
                                <div>
                                  <External url={s.url}>{s.title}</External>
                                  <small>{new URL(s.url).hostname}</small>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p>
                              No verified sources in this illustrative report.
                            </p>
                          )}
                        </section>
                      </div>
                      {report.prospects.length > 0 && (
                        <section className="panel spaced">
                          <h3>Businesses to investigate</h3>
                          {report.prospects.map((p) => (
                            <div className="report-row" key={p.website}>
                              <div>
                                <strong>{p.name}</strong>
                                <small>{p.reason}</small>
                              </div>
                              <button
                                onClick={() => {
                                  setEditing(null);
                                  setProspectForm({
                                    ...emptyProspect,
                                    name: p.name,
                                    website: p.website,
                                    notes: p.reason,
                                  });
                                }}
                              >
                                <Plus size={15} />
                                Add prospect
                              </button>
                            </div>
                          ))}
                        </section>
                      )}
                    </>
                  ) : (
                    <section className="panel">
                      <div className="section-heading">
                        <h3>Research library</h3>
                        <div className="search">
                          <Search size={16} />
                          <input
                            aria-label="Search research"
                            placeholder="Search research…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      {reports
                        .filter((r) =>
                          r.title.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((r) => (
                          <button
                            className="report-row"
                            key={r.id}
                            onClick={() => setActiveReport(r.id)}
                          >
                            <span className="row-icon">
                              <ScanSearch size={20} />
                            </span>
                            <div>
                              <strong>{r.title}</strong>
                              <small>
                                {(r.payload as Report).brief.mode} ·{" "}
                                {(r.payload as Report).findings.length} findings
                                · {(r.payload as Report).sources.length} sources
                              </small>
                            </div>
                            <ArrowUpRight size={18} />
                          </button>
                        ))}
                      {!reports.length && (
                        <Blank
                          title="Build your research library"
                          text="Save audience and business research here, with the sources behind every useful insight."
                          action={
                            <button onClick={() => startBrief()}>
                              Create your first brief
                            </button>
                          }
                        />
                      )}
                    </section>
                  )}
                </>
              )}
              {tab === "Prospects" && (
                <section className="panel">
                  <div className="section-heading">
                    <div className="search">
                      <Search size={16} />
                      <input
                        aria-label="Search prospects"
                        placeholder="Find a business…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter by stage"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      {[
                        "All stages",
                        "To research",
                        "Researching",
                        "Ready to draft",
                        "Drafted",
                        "Contacted",
                        "Replied",
                        "Archived",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {filteredProspects.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Business</th>
                            <th>Contact</th>
                            <th>Stage</th>
                            <th>Next step</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProspects.map((r) => {
                            const p = r.payload as Prospect;
                            return (
                              <tr key={r.id}>
                                <td>
                                  <button
                                    className="business-name"
                                    onClick={() => {
                                      setEditing(r);
                                      setProspectForm({ ...p });
                                    }}
                                  >
                                    {p.name}
                                  </button>
                                  {p.website && (
                                    <small>
                                      <External url={p.website}>
                                        {new URL(p.website).hostname}
                                      </External>
                                    </small>
                                  )}
                                </td>
                                <td>
                                  {p.contact || (
                                    <span className="muted">Not added</span>
                                  )}
                                  {p.email && <small>{p.email}</small>}
                                </td>
                                <td>
                                  <span
                                    className={
                                      "tag " +
                                      (p.stage === "Replied" ? "green" : "")
                                    }
                                  >
                                    {p.stage}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="text-button"
                                    onClick={() => startBrief("prospect", p)}
                                  >
                                    Research <ArrowUpRight size={14} />
                                  </button>
                                </td>
                                <td>
                                  <button
                                    className="icon-button"
                                    aria-label={`Delete ${p.name}`}
                                    onClick={() => setDeleteTarget(r)}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Blank
                      title={
                        prospects.length
                          ? "No prospects match your filter."
                          : "Keep your best-fit prospects here."
                      }
                      text="Add a business website, research the opportunity, and keep track of the conversation."
                      action={
                        <button
                          onClick={() => {
                            setEditing(null);
                            setProspectForm({ ...emptyProspect });
                          }}
                        >
                          <Plus size={15} />
                          Add prospect
                        </button>
                      }
                    />
                  )}
                </section>
              )}
              {tab === "Draft studio" && (
                <>
                  {draftEdit && draftRecord ? (
                    <section className="panel form-panel">
                      <div className="section-heading">
                        <div>
                          <span className="tag purple">
                            {draftEdit.channel === "email"
                              ? "Email"
                              : "LinkedIn DM"}
                          </span>
                          <h3>{draftRecord.title}</h3>
                        </div>
                        <button
                          className="icon-button"
                          aria-label="Close draft"
                          onClick={() => {
                            setCurrentDraft(null);
                            setDraftEdit(null);
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {draftEdit.channel === "email" && (
                        <Field label="Subject">
                          <input
                            maxLength={180}
                            value={draftEdit.subject}
                            onChange={(e) =>
                              setDraftEdit({
                                ...draftEdit,
                                subject: e.target.value,
                                approved: false,
                              })
                            }
                          />
                        </Field>
                      )}
                      <Field label="Message">
                        <textarea
                          className="draft-body"
                          maxLength={5000}
                          value={draftEdit.body}
                          onChange={(e) =>
                            setDraftEdit({
                              ...draftEdit,
                              body: e.target.value,
                              approved: false,
                            })
                          }
                        />
                      </Field>
                      <div className="word-count">
                        {
                          draftEdit.body.trim().split(/\s+/).filter(Boolean)
                            .length
                        }{" "}
                        words · {draftEdit.body.length} characters
                      </div>
                      <Field label="Optional follow-up">
                        <textarea
                          maxLength={2500}
                          value={draftEdit.followUp}
                          onChange={(e) =>
                            setDraftEdit({
                              ...draftEdit,
                              followUp: e.target.value,
                              approved: false,
                            })
                          }
                        />
                      </Field>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={draftEdit.approved}
                          onChange={(e) =>
                            setDraftEdit({
                              ...draftEdit,
                              approved: e.target.checked,
                            })
                          }
                        />
                        I have reviewed the facts and wording.
                      </label>
                      <div className="actions">
                        <button
                          className="primary"
                          disabled={!!busy}
                          onClick={async () => {
                            setBusy("save");
                            try {
                              await save(
                                "draft",
                                draftRecord.title,
                                draftEdit,
                                draftRecord,
                              );
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setBusy("");
                            }
                          }}
                        >
                          Save draft
                        </button>
                        <button
                          onClick={() =>
                            copy(
                              (draftEdit.channel === "email"
                                ? `Subject: ${draftEdit.subject}\n\n`
                                : "") + draftEdit.body,
                            )
                          }
                        >
                          <Copy size={15} />
                          Copy
                        </button>
                        <button
                          onClick={() =>
                            download(
                              "outreach-draft.txt",
                              (draftEdit.subject
                                ? draftEdit.subject + "\n\n"
                                : "") +
                                draftEdit.body +
                                "\n\nFollow-up:\n" +
                                draftEdit.followUp,
                            )
                          }
                        >
                          <Download size={15} />
                          Download
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Delete draft"
                          onClick={() => setDeleteTarget(draftRecord)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="muted">
                        Saving or copying does not send a message.
                      </p>
                    </section>
                  ) : (
                    <>
                      <div className="two-col">
                        <section className="panel">
                          <h3>Write a new draft</h3>
                          <p>
                            Select the business and the evidence you want to
                            use.
                          </p>
                          <Field label="Prospect">
                            <select
                              value={selectedProspect}
                              onChange={(e) => {
                                setSelectedProspect(e.target.value);
                                setChecked([]);
                              }}
                            >
                              <option value="">Choose a prospect</option>
                              {prospects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Business research report">
                            <select
                              value={selectedReport}
                              onChange={(e) => {
                                setSelectedReport(e.target.value);
                                setChecked([]);
                              }}
                            >
                              <option value="">
                                Choose a report for this business
                              </option>
                              {reports
                                .filter(
                                  (r) =>
                                    (r.payload as Report).brief.mode ===
                                    "prospect",
                                )
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.title}
                                  </option>
                                ))}
                            </select>
                          </Field>
                          <Field label="Channel">
                            <div className="segmented">
                              <button
                                type="button"
                                className={
                                  channel === "email" ? "selected" : ""
                                }
                                onClick={() => setChannel("email")}
                              >
                                <Mail size={17} />
                                Email
                              </button>
                              <button
                                type="button"
                                className={
                                  channel === "linkedin" ? "selected" : ""
                                }
                                onClick={() => setChannel("linkedin")}
                              >
                                <MessageSquare size={17} />
                                LinkedIn DM
                              </button>
                            </div>
                          </Field>
                          <button
                            className="primary"
                            disabled={
                              !!busy ||
                              !selectedProspect ||
                              !selectedReport ||
                              !checked.length
                            }
                            onClick={generateDraft}
                          >
                            {busy === "draft" ? (
                              <LoaderCircle size={16} className="spin" />
                            ) : (
                              <PenLine size={16} />
                            )}{" "}
                            {busy === "draft" ? "Writing…" : "Generate draft"}
                          </button>
                          <small className="block">
                            One AI request. Review the result before using it.
                          </small>
                        </section>
                        <section className="panel evidence">
                          <span className="eyebrow">
                            THE REASON TO REACH OUT
                          </span>
                          <h3>Choose your evidence</h3>
                          <p>
                            Select up to five observations after reviewing their
                            sources.
                          </p>
                          {linkedReport ? (
                            linkedReport.findings.map((f, i) =>
                              f.kind === "observation" &&
                              f.sourceUrls.length > 0 ? (
                                <div className="evidence-item" key={i}>
                                  <label className="checkbox">
                                    <input
                                      type="checkbox"
                                      checked={checked.includes(i)}
                                      disabled={
                                        !checked.includes(i) &&
                                        checked.length >= 5
                                      }
                                      onChange={(e) =>
                                        setChecked(
                                          e.target.checked
                                            ? [...checked, i]
                                            : checked.filter((x) => x !== i),
                                        )
                                      }
                                    />
                                    {f.claim}
                                  </label>
                                  <div className="source-links">
                                    {f.sourceUrls.map((s, j) => (
                                      <External key={s} url={s}>
                                        Source {j + 1}
                                      </External>
                                    ))}
                                  </div>
                                </div>
                              ) : null,
                            )
                          ) : (
                            <Blank
                              title="Evidence comes first."
                              text="Select a business research report to see the observations you can use."
                            />
                          )}
                          {linkedReport &&
                            !linkedReport.findings.some(
                              (f) =>
                                f.kind === "observation" && f.sourceUrls.length,
                            ) && (
                              <p>
                                No sourced observations are available. Research
                                this business again before drafting.
                              </p>
                            )}
                        </section>
                      </div>
                      <section className="panel spaced">
                        <div className="section-heading">
                          <h3>Saved drafts</h3>
                          <span className="tag">{drafts.length} drafts</span>
                        </div>
                        {drafts.map((r) => {
                          const d = r.payload as Draft;
                          return (
                            <button
                              className="report-row"
                              key={r.id}
                              onClick={() => openDraft(r)}
                            >
                              <span className="row-icon">
                                {d.channel === "email" ? (
                                  <Mail size={19} />
                                ) : (
                                  <MessageSquare size={19} />
                                )}
                              </span>
                              <div>
                                <strong>{r.title}</strong>
                                <small>
                                  {d.subject || "LinkedIn direct message"}
                                </small>
                              </div>
                              <span
                                className={
                                  "tag " + (d.approved ? "green" : "amber")
                                }
                              >
                                {d.approved ? "Reviewed" : "Needs review"}
                              </span>
                              <ChevronRight size={17} />
                            </button>
                          );
                        })}
                        {!drafts.length && (
                          <Blank
                            title="No drafts yet."
                            text="Research a prospect, review the evidence, then write your first message."
                          />
                        )}
                      </section>
                    </>
                  )}
                </>
              )}
              {tab === "Settings" && (
                <>
                  <section className="panel form-panel">
                    <h3>Your agency profile</h3>
                    <p>
                      Give every draft the same clear offer and natural voice.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy("save");
                        try {
                          await save(
                            "profile",
                            "Agency profile",
                            profile,
                            records.find((r) => r.kind === "profile"),
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy("");
                        }
                      }}
                    >
                      <div className="field-grid">
                        <Field label="Agency name">
                          <input
                            required
                            maxLength={100}
                            value={profile.agency}
                            onChange={(e) =>
                              setProfile({ ...profile, agency: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Sender name">
                          <input
                            required
                            maxLength={100}
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="What you offer">
                        <textarea
                          required
                          minLength={5}
                          maxLength={2000}
                          value={profile.offer}
                          onChange={(e) =>
                            setProfile({ ...profile, offer: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Tone">
                        <select
                          value={profile.tone}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              tone: e.target.value as Profile["tone"],
                            })
                          }
                        >
                          {[
                            "Friendly and direct",
                            "Professional",
                            "Warm and curious",
                          ].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Preferred next step">
                        <input
                          maxLength={300}
                          value={profile.cta}
                          onChange={(e) =>
                            setProfile({ ...profile, cta: e.target.value })
                          }
                        />
                      </Field>
                      <button className="primary" disabled={!!busy}>
                        Save agency profile
                      </button>
                    </form>
                  </section>
                  <section className="panel form-panel spaced">
                    <h3>Your workspace data</h3>
                    <p>
                      Export your reports, prospect records, and drafts as JSON.
                      Store the export somewhere private.
                    </p>
                    <div className="actions">
                      <button onClick={exportData}>
                        <Download size={16} />
                        Export workspace
                      </button>
                      {!demo && (
                        <button onClick={reload}>
                          <RefreshCw size={16} />
                          Refresh records
                        </button>
                      )}
                    </div>
                    <div className="research-scope">
                      <ShieldCheck size={18} />
                      <p>
                        Records are private to your account. LinkedIn and email
                        are drafting channels only. No sending integrations are
                        connected.
                      </p>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      {prospectForm && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-title"
            className="modal panel"
          >
            <div className="section-heading">
              <h2 id="prospect-title">
                {editing ? "Edit prospect" : "Add a prospect"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close prospect form"
                onClick={() => setProspectForm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveProspect}>
              <Field label="Business name">
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={200}
                  value={prospectForm.name}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Website">
                <input
                  type="url"
                  value={prospectForm.website}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      website: e.target.value,
                    })
                  }
                  placeholder="https://"
                />
              </Field>
              <div className="field-grid">
                <Field label="Contact name (optional)">
                  <input
                    maxLength={200}
                    value={prospectForm.contact}
                    onChange={(e) =>
                      setProspectForm({
                        ...prospectForm,
                        contact: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Email (optional)">
                  <input
                    type="email"
                    value={prospectForm.email}
                    onChange={(e) =>
                      setProspectForm({
                        ...prospectForm,
                        email: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="LinkedIn URL (optional)">
                <input
                  type="url"
                  value={prospectForm.linkedin}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      linkedin: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Pipeline stage">
                <select
                  value={prospectForm.stage}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      stage: e.target.value as Prospect["stage"],
                    })
                  }
                >
                  {[
                    "To research",
                    "Researching",
                    "Ready to draft",
                    "Drafted",
                    "Contacted",
                    "Replied",
                    "Archived",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <textarea
                  maxLength={6000}
                  value={prospectForm.notes}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, notes: e.target.value })
                  }
                />
              </Field>
              <button className="primary" disabled={!!busy}>
                Save prospect
              </button>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="modal-backdrop">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="modal panel compact"
          >
            <h2 id="delete-title">Delete this {deleteTarget.kind}?</h2>
            <p>
              “{deleteTarget.title}” will be removed. Other records will remain.
            </p>
            <div className="actions">
              <button onClick={() => setDeleteTarget(null)}>Keep it</button>
              <button
                className="danger"
                disabled={!!busy}
                onClick={async () => {
                  setBusy("delete");
                  try {
                    if (!demo)
                      await api("/api/records", "DELETE", {
                        id: deleteTarget.id,
                      });
                    setRecords((r) =>
                      r.filter((x) => x.id !== deleteTarget.id),
                    );
                    if (currentDraft === deleteTarget.id) {
                      setCurrentDraft(null);
                      setDraftEdit(null);
                    }
                    if (activeReport === deleteTarget.id) setActiveReport(null);
                    setDeleteTarget(null);
                    setNotice("Record deleted.");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                Delete record
              </button>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
