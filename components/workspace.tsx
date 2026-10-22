"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Microscope,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TrainFront,
  Upload,
  Users,
  X,
  GitCompareArrows,
  Clock3,
  ExternalLink,
  Pencil,
  Trash2,
  ImageIcon,
  Eye,
  Layers3,
  CircleDot,
  LoaderCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Session } from "@supabase/supabase-js";
import {
  configured,
  configuration,
  hasConfiguration,
  supabase,
} from "@/lib/supabase";
import { explainBackendError } from "@/lib/backend-config";
import BackendStatus from "./backend-status";
import AdminVerification from "./admin-verification";
import {
  demoEntries,
  specFields,
  filterTesters,
  displaySpec,
  comparisonCsv,
  validateFile,
  allowedExtensions,
  type Entry,
  type Kind,
  type Resource,
  type Spec,
} from "@/lib/data";
import Diagram from "./diagram";
const nav = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/testers", label: "Bearing testers", icon: Database },
  { path: "/bearings", label: "Bearing information", icon: CircleDot },
  { path: "/suspension", label: "Primary suspension", icon: Layers3 },
  { path: "/project", label: "Our design project", icon: Microscope },
  { path: "/resources", label: "Documents & gallery", icon: FolderOpen },
];
const kinds: Kind[] = [
  "tester",
  "bearing",
  "suspension",
  "project",
  "research",
  "update",
];
const sectionKind: Record<string, Kind> = {
  bearings: "bearing",
  suspension: "suspension",
  project: "project",
  research: "research",
  updates: "update",
};
const titles: Record<string, string> = {
  testers: "Bearing testers",
  bearings: "Bearing information",
  suspension: "Primary suspension",
  project: "Our design project",
  resources: "Documents & gallery",
  admin: "Content workspace",
  research: "Research library",
  updates: "Project updates",
};
function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Markdown({ body }: { body: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        urlTransform={(url) =>
          /^https?:\/\//i.test(url) || url.startsWith("#") ? url : ""
        }
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
function downloadCsv(entries: Entry[], imperial: boolean) {
  const url = URL.createObjectURL(
    new Blob([comparisonCsv(entries, imperial)], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "rail-lab-tester-comparison.csv";
  a.click();
  URL.revokeObjectURL(url);
}
export default function Workspace() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0] || "overview";
  const detailId = parts[1];
  const [entries, setEntries] = useState<Entry[]>(
    hasConfiguration ? [] : demoEntries,
  );
  const [resources, setResources] = useState<Resource[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState("");
  const [authRevision, setAuthRevision] = useState(0);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState(configuration.error);
  const [notice, setNotice] = useState("");
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minLoad, setMinLoad] = useState("");
  const [minSpeed, setMinSpeed] = useState("");
  const [sort, setSort] = useState("recent");
  const [advanced, setAdvanced] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState(false);
  const [imperial, setImperial] = useState(false);
  const [editor, setEditor] = useState<Entry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resourceEdit, setResourceEdit] = useState<Resource | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    resource: Resource;
  } | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const editable = ["editor", "admin"].includes(role);
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    if (!supabase) return;
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    const [e, r] = await Promise.all([
      supabase
        .from("entries")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (sequence !== loadSequence.current) return;
    if (e.error || r.error) {
      setEntries([]);
      setResources([]);
      setError(explainBackendError((e.error || r.error)!));
    } else {
      setEntries(e.data as Entry[]);
      setResources(r.data as Resource[]);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, value) => {
      // Clear private records before loading the next session's permitted data.
      if (_event !== "INITIAL_SESSION") {
        ++loadSequence.current;
        setEntries([]);
        setResources([]);
        setRole("");
        setEditor(null);
        setUploading(false);
        setResourceEdit(null);
        setPreview(null);
        setSelected([]);
        setAuthRevision((revision) => revision + 1);
      }
      setSession(value);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    setRole("");
    if (supabase && session)
      supabase
        .from("members")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (active) {
            setRole(data?.role || "");
            if (error) setError(error.message);
          }
        });
    void load();
    return () => {
      active = false;
    };
  }, [session, authRevision, load]);
  useEffect(() => {
    setMobile(false);
    setSearch(new URLSearchParams(window.location.search).get("q") || "");
    setCategory("");
    setMinLoad("");
    setMinSpeed("");
  }, [pathname]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  const testers = entries.filter((e) => e.kind === "tester");
  const chosen = testers.filter((e) => selected.includes(e.id));
  function blank(kind: Kind = "tester"): Entry {
    return {
      id: "",
      kind,
      title: "",
      organization: "",
      category: "",
      summary: "",
      body: "",
      specs: {},
      tags: [],
      sources: [],
      status: "draft",
      visibility: "team",
      demo: false,
      updated_at: new Date().toISOString(),
    };
  }
  async function saveEntry(entry: Entry) {
    if (!supabase || !editable)
      throw new Error("An authorized team account is required.");
    const { id, ...values } = entry;
    const result = id
      ? await supabase
          .from("entries")
          .update(values)
          .eq("id", id)
          .select("id")
          .single()
      : await supabase.from("entries").insert(values).select("id").single();
    if (result.error) throw new Error(explainBackendError(result.error));
    setEditor(null);
    setNotice("Entry saved successfully.");
    await load();
  }
  async function deleteEntry(entry: Entry) {
    if (
      !supabase ||
      !confirm(
        `Delete “${entry.title}”? Linked files must be reassigned or deleted first.`,
      )
    )
      return;
    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entry.id)
      .select("id")
      .single();
    if (error)
      setError(
        error.code === "23503"
          ? "Reassign or delete this entry’s attachments before deleting it."
          : explainBackendError(error),
      );
    else {
      setNotice("Entry deleted.");
      await load();
    }
  }
  async function openResource(resource: Resource, download = false) {
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from("research-files")
      .createSignedUrl(
        resource.path,
        120,
        download ? { download: resource.name } : undefined,
      );
    if (error) {
      setError(error.message);
      return;
    }
    if (download) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.rel = "noopener";
      a.click();
    } else setPreview({ url: data.signedUrl, resource });
  }
  async function deleteResource(r: Resource) {
    if (!supabase || !confirm(`Permanently delete ${r.name}?`)) return;
    const file = await supabase.storage.from("research-files").remove([r.path]);
    if (file.error) {
      setError(file.error.message);
      return;
    }
    const result = await supabase
      .from("resources")
      .delete()
      .eq("id", r.id)
      .select("id")
      .single();
    if (result.error)
      setError(
        `File removed, but metadata deletion failed: ${result.error.message}. Retry deletion.`,
      );
    else setNotice("Attachment deleted.");
    await load();
  }
  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
    if (!selected.includes(id) && selected.length === 4)
      setNotice("Compare up to four testers at a time.");
  }
  function renderResource(r: Resource) {
    const image = r.mime.startsWith("image/");
    return (
      <article className="resource-row" key={r.id}>
        <div className={`file-icon ${image ? "green" : ""}`}>
          {image ? <ImageIcon size={21} /> : <FileText size={21} />}
        </div>
        <div className="resource-info">
          <strong>{r.name}</strong>
          <span>
            {r.caption || r.category || "Uncategorized"} ·{" "}
            {(r.size / 1024 / 1024).toFixed(2)} MB · {r.visibility}
            {r.status === "draft" ? " · Draft" : ""}
          </span>
          {r.tags.length > 0 && <small>{r.tags.join(" · ")}</small>}
        </div>
        {(image || r.mime === "application/pdf") && (
          <button
            className="icon-button"
            title={`Preview ${r.name}`}
            onClick={() => openResource(r)}
          >
            <Eye size={17} />
          </button>
        )}
        <button
          className="icon-button"
          title={`Download ${r.name}`}
          onClick={() => openResource(r, true)}
        >
          <ArrowDownToLine size={17} />
        </button>
        {editable && (
          <>
            <button
              className="icon-button"
              title={`Edit ${r.name}`}
              onClick={() => setResourceEdit(r)}
            >
              <Pencil size={16} />
            </button>
            <button
              className="icon-button danger"
              title={`Delete ${r.name}`}
              onClick={() => deleteResource(r)}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </article>
    );
  }
  function renderCard(e: Entry, i: number) {
    return (
      <article className="tester-card" key={e.id}>
        <Link
          href={`/testers/${e.id}`}
          className={`card-visual visual-${i % 3}`}
        >
          <span className="visual-number">
            FIG. {String(i + 1).padStart(2, "0")}
          </span>
          <Diagram variant={i % 3} />
          <span className="schematic-label">ILLUSTRATIVE CONCEPT</span>
        </Link>
        <div className="tester-card-body">
          <div className="card-kicker">
            <span>{e.category || "Uncategorized"}</span>
            {e.demo && <Badge>Demo</Badge>}
          </div>
          <Link href={`/testers/${e.id}`} className="card-title">
            {e.title}
            <ArrowRight size={17} />
          </Link>
          <p>{e.summary}</p>
          <div className="card-meta">
            <span>
              <Gauge size={14} />
              {e.specs.speed === undefined
                ? "Speed not documented"
                : displaySpec("speed", e.specs.speed, imperial)}
            </span>
            <span>
              <Activity size={14} />
              {e.specs.load === undefined
                ? "Load not documented"
                : displaySpec("load", e.specs.load, imperial)}
            </span>
          </div>
          <div className="card-footer">
            <span className="org-name">
              {e.organization || "Organization not documented"}
            </span>
            <label className="compare-check">
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() => toggle(e.id)}
              />{" "}
              Compare
            </label>
          </div>
        </div>
      </article>
    );
  }
  const current = entries.find((e) => e.id === detailId);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link href="/" className="brand">
          <div className="brand-icon">
            <TrainFront size={23} />
          </div>
          <div>
            RAIL<span>LAB</span>
            <small>ENGINEERING KNOWLEDGE BASE</small>
          </div>
        </Link>
        <div className="workspace-name">
          <div className="workspace-avatar">SD</div>
          <div>
            Senior Design Team<small>Passenger rail research</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              key={n.path}
              href={n.path}
              className={
                pathname === n.path ||
                (n.path !== "/" && pathname.startsWith(n.path))
                  ? "active"
                  : ""
              }
            >
              <n.icon size={18} />
              {n.label}
              {n.path === "/testers" && (
                <span className="nav-count">
                  {testers.length.toString().padStart(2, "0")}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-project">
          <span className="tiny-label">
            <span className="status-dot" /> OUR SENIOR DESIGN PROJECT
          </span>
          <strong>From research to rail.</strong>
          <p>A bearing test rig built on better engineering knowledge.</p>
          <div className="mini-progress">
            <span />
          </div>
          <div className="project-stage">
            Current phase <b>Research & discovery</b>
          </div>
          <Link href="/project">
            Explore our project <ArrowRight size={14} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link href="/admin" className={section === "admin" ? "active" : ""}>
            <Settings2 size={18} />
            Admin workspace
            <ShieldCheck size={14} />
          </Link>
          <div className="team-footer">
            <div className="avatar-stack">
              <span>SD</span>
              <span>
                <Users size={13} />
              </span>
            </div>
            <div>
              Built for our team<small>Driven by curiosity.</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>{titles[section] || "Overview"}</strong>
          </div>
          <form className="global-search" action="/testers">
            <Search size={16} />
            <input
              name="q"
              aria-label="Search the tester database"
              placeholder="Search the tester database…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <span className="header-divider" />
          <Link
            href="/admin"
            className="header-avatar"
            aria-label="Open team workspace"
          >
            {session ? "TM" : "SD"}
          </Link>
        </header>
        <main>
          <div className="page-topline">
            <span>
              <span className="status-dot" />
              {configuration.mode === "invalid"
                ? "BACKEND CONFIGURATION REQUIRED"
                : configured
                  ? "RESEARCH WORKSPACE"
                  : "DEMONSTRATION WORKSPACE"}
            </span>
            <span className="topline-right">
              <ShieldCheck size={13} />
              {configured
                ? "Source-aware engineering research"
                : "Sample entries · No verified equipment ratings"}
            </span>
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button className="text-button" onClick={() => load()}>
                Retry
              </button>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="empty">
              <LoaderCircle className="spin" />
              Loading research workspace…
            </div>
          ) : detailId ? (
            current ? (
              <>
                <Link
                  href={
                    current.kind === "tester"
                      ? "/testers"
                      : `/${Object.keys(sectionKind).find((k) => sectionKind[k] === current.kind) || "research"}`
                  }
                  className="back-link"
                >
                  <ArrowLeft size={15} />
                  Back to library
                </Link>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      {current.category || "RESEARCH ENTRY"}
                    </div>
                    <h1>{current.title}</h1>
                    <p>{current.summary}</p>
                  </div>
                  {editable && (
                    <button
                      className="button primary"
                      onClick={() => setEditor(current)}
                    >
                      <Pencil size={16} />
                      Edit entry
                    </button>
                  )}
                </div>
                <div className="detail-meta">
                  <Badge tone="blue">{current.kind}</Badge>
                  {current.demo && (
                    <Badge tone="amber">Demonstration · unverified</Badge>
                  )}
                  <span>{current.organization}</span>
                  <span>
                    {current.visibility === "team" ? "Team only" : "Public"} ·{" "}
                    {current.status}
                  </span>
                </div>
                {current.kind === "tester" && (
                  <div className="detail-diagram">
                    <Diagram hero />
                  </div>
                )}
                <div className="detail-columns">
                  <section className="panel article-panel">
                    <Markdown body={current.body} />
                    {current.sources.length > 0 && (
                      <>
                        <h2>Sources & references</h2>
                        {current.sources.map((s, i) => (
                          <a
                            key={i}
                            className="source-link"
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {s.label}
                            <ExternalLink size={14} />
                          </a>
                        ))}
                      </>
                    )}
                    {current.tags.length > 0 && (
                      <div className="tags">
                        {current.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    )}
                  </section>
                  <aside className="panel specs-panel">
                    <div className="section-title">
                      <h2>Technical specifications</h2>
                      <button
                        className="unit-switch"
                        onClick={() => setImperial(!imperial)}
                      >
                        {imperial ? "Imperial" : "SI units"}
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    {specFields.map((f) => (
                      <div className="spec-row" key={f.key}>
                        <span>{f.label}</span>
                        <strong>
                          {displaySpec(f.key, current.specs[f.key], imperial)}
                        </strong>
                      </div>
                    ))}
                  </aside>
                </div>
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Images & attachments</h2>
                    {editable && (
                      <button
                        className="button"
                        onClick={() => setUploading(true)}
                      >
                        <Upload size={15} />
                        Upload files
                      </button>
                    )}
                  </div>
                  <ImageGallery
                    resources={resources.filter(
                      (r) => r.entry_id === current.id,
                    )}
                    onOpen={(r) => openResource(r)}
                  />
                  {resources.filter((r) => r.entry_id === current.id).length ? (
                    resources
                      .filter((r) => r.entry_id === current.id)
                      .map(renderResource)
                  ) : (
                    <div className="empty compact">
                      <ImageIcon />
                      No supporting files yet. Add drawings, images, or source
                      documents.
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="empty">
                <Database />
                <h2>Entry not found</h2>
                <p>
                  This entry may be a private draft or may have been removed.
                </p>
                <Link className="button" href="/testers">
                  Back to database
                </Link>
              </div>
            )
          ) : section === "overview" ? (
            <>
              <div className="page-heading overview-heading">
                <div>
                  <h1>Engineering starts with understanding.</h1>
                  <p>
                    Your research hub for passenger rail bearing testing and
                    primary suspension.
                  </p>
                </div>
                <Link className="button" href="/project">
                  <Microscope size={16} />
                  Our project
                  <ArrowUpRight />
                </Link>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-eyebrow">
                    <span />
                    PASSENGER RAIL RESEARCH
                  </div>
                  <h2>
                    Better research.
                    <br />
                    Stronger design.
                  </h2>
                  <p>
                    Explore bearing test systems, connect technical insights,
                    and build the foundation for our next engineering solution.
                  </p>
                  <div className="hero-actions">
                    <Link href="/testers" className="button light">
                      Explore bearing testers
                      <ArrowRight size={16} />
                    </Link>
                    <Link href="/project" className="hero-link">
                      View our project
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div className="hero-footnote">
                    <CircleDot size={13} />
                    Passenger bearings <span>·</span>Primary suspension{" "}
                    <span>·</span>Test rig design
                  </div>
                </div>
                <div className="hero-art">
                  <div className="drawing-label">
                    DESIGN EXPLORATION <span>001 / CONCEPT</span>
                  </div>
                  <Diagram hero />
                  <div className="drawing-footer">
                    <span className="status-dot" />
                    Single-bearing test arrangement<span>PRELIMINARY</span>
                  </div>
                </div>
              </section>
              <div className="stats-grid">
                {[
                  {
                    icon: Database,
                    n: testers.length,
                    label: "Bearing testers",
                    sub: "In the research database",
                    href: "/testers",
                    color: "blue",
                  },
                  {
                    icon: BookOpen,
                    n: entries.filter((e) =>
                      ["bearing", "suspension", "research"].includes(e.kind),
                    ).length,
                    label: "Technical entries",
                    sub: "Knowledge to build on",
                    href: "/research",
                    color: "teal",
                  },
                  {
                    icon: FolderOpen,
                    n: resources.length,
                    label: "Research resources",
                    sub: "Documents & engineering files",
                    href: "/resources",
                    color: "purple",
                  },
                  {
                    icon: Microscope,
                    n: "01",
                    label: "Senior design project",
                    sub: "Research & discovery phase",
                    href: "/project",
                    color: "orange",
                  },
                ].map((s) => (
                  <Link href={s.href} key={s.label} className="stat-card">
                    <span className={`stat-icon ${s.color}`}>
                      <s.icon size={20} />
                    </span>
                    <ArrowUpRight />
                    <strong>
                      {typeof s.n === "number"
                        ? s.n.toString().padStart(2, "0")
                        : s.n}
                    </strong>
                    <b>{s.label}</b>
                    <small>{s.sub}</small>
                  </Link>
                ))}
              </div>
              <section className="featured-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">EXPLORE THE LANDSCAPE</div>
                    <h2>Featured bearing testers</h2>
                    <p>
                      A starting point for comparing test approaches and
                      capabilities.
                    </p>
                  </div>
                  <Link href="/testers" className="text-link">
                    View all testers
                    <ArrowRight size={15} />
                  </Link>
                </div>
                {!configured && (
                  <div className="subtle-note">
                    <CircleHelp size={14} />
                    Example concepts for exploring the library. Technical
                    ratings are intentionally left undocumented.
                  </div>
                )}
                <div className="tester-grid">
                  {testers.slice(0, 3).map(renderCard)}
                </div>
                {!testers.length && (
                  <div className="empty">No testers published yet.</div>
                )}
              </section>
              <div className="bottom-grid">
                <section className="panel research-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">THE KNOWLEDGE LIBRARY</span>
                      <h2>Recently added research</h2>
                    </div>
                    <Link href="/research" className="text-link">
                      Browse library
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  {entries
                    .filter((e) =>
                      ["bearing", "research", "suspension"].includes(e.kind),
                    )
                    .slice(0, 3)
                    .map((e) => (
                      <Link
                        className="research-row"
                        key={e.id}
                        href={`/${Object.keys(sectionKind).find((k) => sectionKind[k] === e.kind) || "research"}/${e.id}`}
                      >
                        <div className="file-icon">
                          <FileText size={20} />
                        </div>
                        <div>
                          <strong>{e.title}</strong>
                          <span>
                            {e.category} <i>·</i>{" "}
                            {e.demo ? "Example research" : "Research entry"}
                          </span>
                        </div>
                        <ChevronRight size={16} />
                      </Link>
                    ))}
                </section>
                <section className="panel project-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">FROM CONCEPT TO PROTOTYPE</span>
                      <h2>Our design journey</h2>
                    </div>
                    <Badge tone="green">In progress</Badge>
                  </div>
                  {entries.some((e) => e.kind === "update") ? (
                    <ProjectUpdates entries={entries} />
                  ) : (
                    <div className="timeline-mini">
                      <div className="timeline-node complete">
                        <Check size={12} />
                      </div>
                      <div>
                        <strong>Define the challenge</strong>
                        <p>Single-bearing tester with primary suspension</p>
                      </div>
                      <div className="timeline-node current">
                        <span />
                      </div>
                      <div>
                        <strong>Research & discovery</strong>
                        <p>Exploring equipment and suspension concepts</p>
                      </div>
                      <div className="timeline-node" />
                      <div>
                        <strong>Concept development</strong>
                        <p>Next: evaluate and select design approaches</p>
                      </div>
                    </div>
                  )}
                  <Link className="text-link" href="/project">
                    Follow project progress
                    <ArrowRight size={14} />
                  </Link>
                </section>
              </div>
              <section className="quick-strip">
                <div>
                  <BookOpen size={21} />
                  <div>
                    <strong>A shared foundation for better decisions.</strong>
                    <p>
                      Capture sources. Document what is known. Make room for
                      what comes next.
                    </p>
                  </div>
                </div>
                <Link href="/admin" className="text-link">
                  Contribute research
                  <ArrowRight size={15} />
                </Link>
              </section>
            </>
          ) : section === "testers" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">RESEARCH DATABASE</div>
                  <h1>Passenger bearing testers</h1>
                  <p>
                    Explore test arrangements, document capabilities, and
                    compare engineering approaches.
                  </p>
                </div>
                {editable && (
                  <button
                    className="button primary"
                    onClick={() => setEditor(blank())}
                  >
                    <Plus size={17} />
                    Add tester
                  </button>
                )}
              </div>
              <div className="database-toolbar">
                <div className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Search testers"
                    placeholder="Search testers, organizations, or specifications…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter by test type"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All test types</option>
                  {[
                    ...new Set(testers.map((e) => e.category).filter(Boolean)),
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button
                  className={`button ${advanced ? "selected" : ""}`}
                  onClick={() => setAdvanced(!advanced)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
                <button
                  className="button"
                  onClick={() => setImperial(!imperial)}
                >
                  {imperial ? "Imperial" : "SI units"}
                </button>
              </div>
              {advanced && (
                <div className="advanced-filters">
                  <label>
                    Minimum load (kN)
                    <input
                      type="number"
                      min="0"
                      value={minLoad}
                      onChange={(e) => setMinLoad(e.target.value)}
                    />
                  </label>
                  <label>
                    Minimum operating speed (km/h)
                    <input
                      type="number"
                      min="0"
                      value={minSpeed}
                      onChange={(e) => setMinSpeed(e.target.value)}
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("");
                      setMinLoad("");
                      setMinSpeed("");
                    }}
                  >
                    Clear filters
                  </button>
                  <span>
                    Unknown ratings are excluded when a minimum is set.
                  </span>
                </div>
              )}
              <div className="results-bar">
                <span>
                  {
                    filterTesters(
                      testers,
                      search,
                      category,
                      minLoad,
                      minSpeed,
                      sort,
                    ).length
                  }{" "}
                  testers{!configured ? " · Demonstration concepts" : ""}
                </span>
                <label>
                  Sort by{" "}
                  <select
                    aria-label="Sort testers"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="recent">Recently updated</option>
                    <option value="name">Name A–Z</option>
                    <option value="load">Highest load</option>
                  </select>
                </label>
              </div>
              <div className="tester-grid">
                {filterTesters(
                  testers,
                  search,
                  category,
                  minLoad,
                  minSpeed,
                  sort,
                ).map(renderCard)}
              </div>
              {!filterTesters(
                testers,
                search,
                category,
                minLoad,
                minSpeed,
                sort,
              ).length && (
                <div className="empty">
                  <Search />
                  <h2>No testers match your search</h2>
                  <p>
                    Try fewer filters or add a verified tester from the admin
                    workspace.
                  </p>
                </div>
              )}
            </>
          ) : section === "resources" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CENTRAL RESOURCE LIBRARY</div>
                  <h1>Documents & image gallery</h1>
                  <p>
                    Source documents, engineering drawings, calculations, and
                    project attachments.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() =>
                    editable
                      ? setUploading(true)
                      : setNotice(
                          configured
                            ? "Sign in with an authorized team account to upload files."
                            : "Persistent uploads require Supabase configuration. See README for setup.",
                        )
                  }
                >
                  <Upload size={16} />
                  Upload resources
                </button>
              </div>
              <div className="database-toolbar">
                <div className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Search resources"
                    placeholder="Search filenames, captions, categories, or tags…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Resource type"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All file types</option>
                  <option value="image">Images</option>
                  <option value="pdf">PDF documents</option>
                  <option value="other">Other attachments</option>
                </select>
              </div>
              <section className="panel">
                <ImageGallery
                  resources={resources.filter(
                    (r) =>
                      (!category || category === "image") &&
                      `${r.name} ${r.caption} ${r.category} ${r.tags.join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                  )}
                  onOpen={(r) => openResource(r)}
                />
                {resources
                  .filter(
                    (r) =>
                      `${r.name} ${r.caption} ${r.category} ${r.tags.join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()) &&
                      (!category ||
                        (category === "image"
                          ? r.mime.startsWith("image/")
                          : category === "pdf"
                            ? r.mime === "application/pdf"
                            : !r.mime.startsWith("image/") &&
                              r.mime !== "application/pdf")),
                  )
                  .map(renderResource)}
                {!resources.length && (
                  <div className="empty">
                    <div className="empty-icon">
                      <FolderOpen size={30} />
                    </div>
                    <h2>A home for your engineering research</h2>
                    <p>
                      Upload images, PDFs, CAD attachments, and calculation
                      files.
                      <br />
                      {configured
                        ? "Team uploads are stored securely in Supabase."
                        : "Connect Supabase to enable persistent uploads and previews."}
                    </p>
                    <span className="muted">
                      JPG, PNG, WebP, PDF, CAD, Excel & more · Up to 25 MB per
                      file
                    </span>
                  </div>
                )}
                {resources.length > 0 &&
                  !resources.some(
                    (r) =>
                      `${r.name} ${r.caption} ${r.category} ${r.tags.join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()) &&
                      (!category ||
                        (category === "image"
                          ? r.mime.startsWith("image/")
                          : category === "pdf"
                            ? r.mime === "application/pdf"
                            : !r.mime.startsWith("image/") &&
                              r.mime !== "application/pdf")),
                  ) && <div className="empty">No matching attachments.</div>}
              </section>
            </>
          ) : section === "admin" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TEAM CONTENT MANAGEMENT</div>
                  <h1>Content workspace</h1>
                  <p>
                    Turn research into a living, source-aware engineering
                    knowledge base.
                  </p>
                </div>
                {session && (
                  <button
                    className="button"
                    onClick={async () => {
                      const { error } = await supabase!.auth.signOut();
                      if (error) setError(error.message);
                    }}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                )}
              </div>
              <BackendStatus editable={editable} />
              {editable && <AdminVerification />}
              {!configured ? (
                <section className="panel setup-panel">
                  <div className="empty-icon">
                    <ShieldCheck size={30} />
                  </div>
                  <h2>Connect your team’s research backend</h2>
                  <p>
                    {configuration.mode === "invalid"
                      ? "The configured backend is invalid. Correct the environment settings to enable secure team access."
                      : "The site is currently in demonstration mode. Editing, authentication, and persistent uploads become available after connecting Supabase."}
                  </p>
                  <ol>
                    <li>
                      Create a Supabase project and run{" "}
                      <code>supabase/schema.sql</code>.
                    </li>
                    <li>
                      Add your project URL and public anon key to{" "}
                      <code>.env.local</code>.
                    </li>
                    <li>
                      Create a team user in Supabase Authentication and grant
                      membership using the README instructions.
                    </li>
                    <li>Restart the app and sign in here.</li>
                  </ol>
                  <div className="alert">
                    No browser-only edits or temporary uploads are presented as
                    saved research.
                  </div>
                </section>
              ) : !session ? (
                <Login onError={setError} />
              ) : !editable ? (
                <section className="panel setup-panel">
                  <ShieldCheck size={30} />
                  <h2>Team authorization required</h2>
                  <p>
                    You are signed in. An administrator must grant editor or
                    admin membership before you can manage research.{" "}
                    {role === "viewer"
                      ? "Your viewer role provides read access to team content."
                      : ""}
                  </p>
                </section>
              ) : (
                <>
                  <div className="admin-actions">
                    <button
                      className="button primary"
                      onClick={() => setEditor(blank())}
                    >
                      <Plus size={16} />
                      New entry
                    </button>
                    <button
                      className="button"
                      onClick={() => setUploading(true)}
                    >
                      <Upload size={16} />
                      Upload files
                    </button>
                    <Badge tone="green">{role} access</Badge>
                  </div>
                  <div className="database-toolbar">
                    <div className="search-field">
                      <Search size={17} />
                      <input
                        aria-label="Search managed content"
                        placeholder="Search content…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Content type"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">All content types</option>
                      {kinds.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="panel admin-list">
                    {entries
                      .filter(
                        (e) =>
                          (!category || e.kind === category) &&
                          `${e.title} ${e.category} ${e.tags.join(" ")}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      )
                      .map((e) => (
                        <div className="admin-row" key={e.id}>
                          <div>
                            <strong>{e.title}</strong>
                            <span>
                              {e.kind} · {e.category || "Uncategorized"} ·{" "}
                              {e.visibility}
                            </span>
                          </div>
                          <Badge tone={e.status === "published" ? "green" : ""}>
                            {e.status}
                          </Badge>
                          <button
                            className="icon-button"
                            aria-label={`Edit ${e.title}`}
                            onClick={() => setEditor(e)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={`Delete ${e.title}`}
                            onClick={() => deleteEntry(e)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    {!entries.length && (
                      <div className="empty">
                        Your library is ready. Create your first research entry.
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : sectionKind[section] ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {section === "project"
                      ? "SENIOR DESIGN · PRELIMINARY"
                      : "TECHNICAL KNOWLEDGE LIBRARY"}
                  </div>
                  <h1>{titles[section]}</h1>
                  <p>
                    {section === "project"
                      ? "A living record of our passenger rail bearing tester design."
                      : section === "suspension"
                        ? "Understand load paths, suspension configurations, and their role in a representative test rig."
                        : "Organized, editable research with room for evidence and engineering detail."}
                  </p>
                </div>
                {editable && (
                  <button
                    className="button primary"
                    onClick={() => setEditor(blank(sectionKind[section]))}
                  >
                    <Plus size={16} />
                    New entry
                  </button>
                )}
              </div>
              {section === "project" && (
                <>
                  <div className="project-banner">
                    <div>
                      <Badge tone="blue">Research & discovery</Badge>
                      <h2>One bearing. A system of possibilities.</h2>
                      <p>
                        Controlled rotation, vertical loading, and
                        representative primary suspension.
                      </p>
                      <span>
                        <CircleHelp size={15} />
                        All design considerations are preliminary. Suspension
                        arrangement is under investigation.
                      </span>
                    </div>
                    <Diagram hero />
                  </div>
                  <div className="milestone-grid">
                    {[
                      "Problem definition",
                      "Research & discovery",
                      "Concept selection",
                      "Detailed design",
                      "Build & validation",
                    ].map((m, i) => (
                      <div
                        key={m}
                        className={i < 2 ? "milestone active" : "milestone"}
                      >
                        <span>
                          {i === 0 ? (
                            <Check size={14} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <strong>{m}</strong>
                        <small>
                          {i === 0
                            ? "Initial scope captured"
                            : i === 1
                              ? "Current phase"
                              : "Planned"}
                        </small>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {section === "project" &&
                entries.some((e) => e.kind === "update") && (
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Project progress & updates</h2>
                      {editable && (
                        <button
                          className="button"
                          onClick={() => setEditor(blank("update"))}
                        >
                          <Plus size={14} />
                          Add update
                        </button>
                      )}
                    </div>
                    <ProjectUpdates entries={entries} />
                  </section>
                )}
              <div className="article-grid">
                {entries
                  .filter((e) => e.kind === sectionKind[section])
                  .map((e) => (
                    <article className="panel knowledge-card" key={e.id}>
                      <div className="card-kicker">
                        <span>{e.category}</span>
                        {e.demo && <Badge>Demo</Badge>}
                      </div>
                      <h2>
                        <Link href={`/${section}/${e.id}`}>{e.title}</Link>
                      </h2>
                      <p>{e.summary}</p>
                      <div className="tags">
                        {e.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                      <details>
                        <summary>
                          Read research notes <ChevronDown size={16} />
                        </summary>
                        <Markdown body={e.body} />
                      </details>
                      <div className="knowledge-footer">
                        <Link
                          href={`/${section}/${e.id}`}
                          className="text-link"
                        >
                          Open full entry
                          <ArrowRight size={14} />
                        </Link>
                        {editable && (
                          <button
                            className="icon-button"
                            aria-label={`Edit ${e.title}`}
                            onClick={() => setEditor(e)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
              {!entries.some((e) => e.kind === sectionKind[section]) && (
                <div className="empty">
                  <BookOpen />
                  <h2>Research starts here</h2>
                  <p>No entries published in this section yet.</p>
                </div>
              )}
              {section === "bearings" && (
                <section className="panel topic-panel">
                  <h2>Build out your bearing research</h2>
                  <div className="topic-grid">
                    {[
                      "Bearing types & components",
                      "Axles & wheel arrangements",
                      "Lubrication & sealing",
                      "Operating conditions",
                      "Failure modes",
                      "Standards & inspection",
                    ].map((t) => (
                      <div key={t}>
                        <CircleDot size={17} />
                        {t}
                        <Badge>To research</Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="empty">
              <h1>Page not found</h1>
              <Link href="/">Return to overview</Link>
            </div>
          )}
          <footer className="footer">
            <span>
              RAIL LAB <i>/</i> Passenger Rail Engineering Research
            </span>
            <span>
              Senior Design Team <span className="footer-dot">·</span> A living
              knowledge base
            </span>
          </footer>
        </main>
      </div>
      {selected.length > 0 && (
        <div className="compare-tray">
          <GitCompareArrows size={20} />
          <div>
            <strong>
              {selected.length} tester{selected.length !== 1 ? "s" : ""}{" "}
              selected
            </strong>
            <small>Select up to 4 to compare side by side</small>
          </div>
          <button className="text-button" onClick={() => setSelected([])}>
            Clear
          </button>
          <button
            className="button primary"
            disabled={chosen.length < 2}
            onClick={() => setComparison(true)}
          >
            Compare testers
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <CircleHelp size={18} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {comparison && (
        <Modal
          title="Tester comparison"
          onClose={() => setComparison(false)}
          wide
        >
          <div className="comparison-actions">
            <p>
              Unknown specifications remain undocumented. Verify original
              sources before design use.
            </p>
            <button className="button" onClick={() => setImperial(!imperial)}>
              {imperial ? "Imperial" : "SI units"}
            </button>
            <button
              className="button primary"
              onClick={() => downloadCsv(chosen, imperial)}
            >
              <ArrowDownToLine size={15} />
              Export CSV
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Specification</th>
                  {chosen.map((e) => (
                    <th key={e.id}>
                      {e.title}
                      {e.demo && <small>DEMONSTRATION · UNVERIFIED</small>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Organization</td>
                  {chosen.map((e) => (
                    <td key={e.id}>{e.organization || "Not documented"}</td>
                  ))}
                </tr>
                {specFields.map((f) => (
                  <tr key={f.key}>
                    <td>{f.label}</td>
                    {chosen.map((e) => (
                      <td key={e.id}>
                        {displaySpec(f.key, e.specs[f.key], imperial)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      {editor && (
        <EntryEditor
          entry={editor}
          categories={entries.map((e) => e.category)}
          onSave={saveEntry}
          onClose={() => setEditor(null)}
        />
      )}
      {uploading && (
        <UploadDialog
          entries={entries}
          onClose={() => setUploading(false)}
          onDone={async () => {
            setUploading(false);
            setNotice("Files uploaded to persistent storage.");
            await load();
          }}
        />
      )}
      {resourceEdit && (
        <ResourceEditor
          resource={resourceEdit}
          entries={entries}
          onClose={() => setResourceEdit(null)}
          onDone={async () => {
            setResourceEdit(null);
            setNotice("Attachment information saved.");
            await load();
          }}
        />
      )}
      {preview && (
        <Modal
          title={preview.resource.name}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="preview-area">
            {preview.resource.mime.startsWith("image/") ? (
              <img
                src={preview.url}
                alt={preview.resource.caption || preview.resource.name}
                onClick={(e) => e.currentTarget.classList.toggle("zoomed")}
              />
            ) : (
              <iframe title={preview.resource.name} src={preview.url} />
            )}
          </div>
          <p className="preview-caption">
            {preview.resource.caption || "No caption"} ·{" "}
            {preview.resource.category}
            <br />
            <small>
              Click an image to toggle full-size zoom. Preview links expire
              after two minutes.
            </small>
          </p>
          <button
            className="button"
            onClick={() => openResource(preview.resource, true)}
          >
            <ArrowDownToLine size={15} />
            Download original
          </button>
        </Modal>
      )}
    </div>
  );
}
function ArrowUpRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const close = dialog?.querySelector<HTMLButtonElement>("button");
    close?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialog) {
        const els = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
          ),
        ).filter((el) => el.getClientRects().length);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prior;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Login({ onError }: { onError: (s: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (error) {
      setError(error.message);
      onError(error.message);
    }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="panel login-panel">
      <div className="empty-icon">
        <ShieldCheck size={28} />
      </div>
      <h2>Welcome back, team.</h2>
      <p>Sign in to manage research and access team-only content.</p>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} className="button primary">
        {busy ? "Signing in…" : "Sign in to workspace"}
        <ArrowRight size={16} />
      </button>
      <small>
        Team accounts are provisioned by your administrator. Contact them for
        access or password recovery.
      </small>
    </form>
  );
}
function EntryEditor({
  entry,
  categories,
  onSave,
  onClose,
}: {
  entry: Entry;
  categories: string[];
  onSave: (e: Entry) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState({ ...entry, specs: { ...entry.specs } });
  const [sources, setSources] = useState(
    entry.sources.map((s) => `${s.label} | ${s.url}`).join("\n"),
  );
  const [tags, setTags] = useState(entry.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const update = (k: keyof Entry, v: unknown) =>
    setValue((prev) => ({ ...prev, [k]: v }));
  function format(before: string, after = "") {
    const area = document.getElementById("body-editor") as HTMLTextAreaElement;
    const start = area.selectionStart,
      end = area.selectionEnd;
    update(
      "body",
      value.body.slice(0, start) +
        before +
        value.body.slice(start, end) +
        after +
        value.body.slice(end),
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = sources
      .split("\n")
      .filter((x) => x.trim())
      .map((line) => {
        const i = line.indexOf("|");
        return {
          label: (i < 0 ? line : line.slice(0, i)).trim(),
          url: (i < 0 ? line : line.slice(i + 1)).trim(),
        };
      });
    if (
      parsed.some((s) => {
        try {
          return !["http:", "https:"].includes(new URL(s.url).protocol);
        } catch {
          return true;
        }
      })
    ) {
      setError("References must use valid http:// or https:// URLs.");
      return;
    }
    if (
      Object.entries(value.specs).some(
        ([k, v]) =>
          ["rpm", "speed", "load"].includes(k) &&
          typeof v === "number" &&
          (!Number.isFinite(v) || v < 0),
      )
    ) {
      setError("Numeric specifications must be nonnegative.");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...value,
        title: value.title.trim(),
        sources: parsed,
        tags: [
          ...new Set(
            tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          ),
        ],
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={entry.id ? "Edit research entry" : "Create research entry"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="editor-form">
        <div className="form-grid">
          <label>
            Content type
            <select
              value={value.kind}
              onChange={(e) => update("kind", e.target.value)}
            >
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <input
              list="categories"
              value={value.category}
              onChange={(e) => update("category", e.target.value)}
            />
            <datalist id="categories">
              {[...new Set(categories.filter(Boolean))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </datalist>
          </label>
          <label className="full">
            Title
            <input
              required
              maxLength={180}
              value={value.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label>
            Organization / manufacturer
            <input
              value={value.organization}
              onChange={(e) => update("organization", e.target.value)}
            />
          </label>
          <label>
            Tags (comma separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <label className="full">
            Summary
            <textarea
              rows={2}
              maxLength={1000}
              value={value.summary}
              onChange={(e) => update("summary", e.target.value)}
            />
          </label>
        </div>
        <div className="rich-label">
          Research notes <span>Markdown formatting · HTML is disabled</span>
        </div>
        <div className="editor-toolbar">
          <button type="button" onClick={() => format("**", "**")}>
            <b>B</b>
          </button>
          <button type="button" onClick={() => format("*", "*")}>
            <i>I</i>
          </button>
          <button type="button" onClick={() => format("\n## ")}>
            Heading
          </button>
          <button type="button" onClick={() => format("\n- ")}>
            List
          </button>
          <button type="button" onClick={() => format("[", "](https://)")}>
            Link
          </button>
          <button type="button" onClick={() => setPreview(!preview)}>
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="editor-preview">
            <Markdown body={value.body} />
          </div>
        ) : (
          <textarea
            id="body-editor"
            aria-label="Research notes"
            rows={10}
            value={value.body}
            onChange={(e) => update("body", e.target.value)}
          />
        )}
        <details className="spec-editor" open={value.kind === "tester"}>
          <summary>
            Technical specifications{" "}
            <small>
              Leave unknown values blank. Use SI units for numeric storage.
            </small>
          </summary>
          <div className="form-grid">
            {specFields.map((f) => (
              <label key={f.key}>
                {f.label}
                {f.unit ? ` (${f.unit})` : ""}
                <input
                  type={f.unit ? "number" : "text"}
                  min={f.unit ? "0" : undefined}
                  step={f.unit ? "any" : undefined}
                  value={value.specs[f.key] ?? ""}
                  onChange={(e) =>
                    setValue((prev) => ({
                      ...prev,
                      specs: {
                        ...prev.specs,
                        [f.key]:
                          e.target.value === ""
                            ? undefined
                            : f.unit
                              ? Number(e.target.value)
                              : e.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </details>
        <label>
          Sources (one per line: label | URL)
          <textarea
            rows={3}
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder="Manufacturer manual | https://…"
          />
        </label>
        <div className="form-grid">
          <label>
            Publication status
            <select
              value={value.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label>
            Visibility
            <select
              value={value.visibility}
              onChange={(e) => update("visibility", e.target.value)}
            >
              <option value="team">Team only</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={value.demo}
            onChange={(e) => update("demo", e.target.checked)}
          />
          This is demonstration content with unverified specifications
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy} className="button primary">
            {busy
              ? "Saving…"
              : value.status === "draft"
                ? "Save draft"
                : "Save & publish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function UploadDialog({
  entries,
  onClose,
  onDone,
}: {
  entries: Entry[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !files.length) return;
    const form = new FormData(e.currentTarget);
    const invalid = files.map((f) => validateFile(f)).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    const completed: string[] = [];
    try {
      for (const file of files) {
        const path = `${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage
          .from("research-files")
          .upload(path, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });
        if (error) throw error;
        const insert = await supabase.from("resources").insert({
          path,
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          caption: form.get("caption"),
          category: form.get("category"),
          tags: String(form.get("tags"))
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          entry_id: form.get("entry_id") || null,
          visibility: form.get("visibility"),
          status: form.get("status"),
        });
        if (insert.error) {
          await supabase.storage.from("research-files").remove([path]);
          throw insert.error;
        }
        completed.push(file.name);
      }
      await onDone();
    } catch (err) {
      setFiles((prev) => prev.filter((f) => !completed.includes(f.name)));
      setError(
        `${explainBackendError(err as Error)}${completed.length ? ` ${completed.length} file(s) were saved. Retry uploads only the remaining files.` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Upload research resources" onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <label className="upload-zone">
          <Upload size={28} />
          <strong>Choose images or engineering files</strong>
          <span>Multiple files · Up to 25 MB each</span>
          <input
            aria-label="Choose files"
            type="file"
            multiple
            required={!files.length}
            accept={allowedExtensions.map((x) => "." + x).join(",")}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </label>
        {files.map((f, i) => (
          <div className="selected-file" key={i}>
            {f.name}
            <small>{(f.size / 1024 / 1024).toFixed(2)} MB</small>
          </div>
        ))}
        <AttachmentFields entries={entries} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy || !files.length} className="button primary">
            {busy ? "Uploading…" : "Upload to storage"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function AttachmentFields({
  entries,
  resource,
}: {
  entries: Entry[];
  resource?: Resource;
}) {
  return (
    <>
      <label>
        Caption / description
        <textarea name="caption" rows={2} defaultValue={resource?.caption} />
      </label>
      <div className="form-grid">
        <label>
          Category
          <input name="category" defaultValue={resource?.category} />
        </label>
        <label>
          Tags (comma separated)
          <input name="tags" defaultValue={resource?.tags.join(", ")} />
        </label>
      </div>
      <label>
        Related research entry
        <select name="entry_id" defaultValue={resource?.entry_id || ""}>
          <option value="">General library</option>
          {entries.map((e) => (
            <option value={e.id} key={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Visibility
          <select
            name="visibility"
            defaultValue={resource?.visibility || "team"}
          >
            <option value="team">Team only</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>
          Publication status
          <select name="status" defaultValue={resource?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>
      <small className="muted">
        An attachment is public only when it and its linked entry are published
        and public.
      </small>
    </>
  );
}
function ResourceEditor({
  resource,
  entries,
  onClose,
  onDone,
}: {
  resource: Resource;
  entries: Entry[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const { error } = await supabase!
      .from("resources")
      .update({
        caption: f.get("caption"),
        category: f.get("category"),
        tags: String(f.get("tags"))
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        entry_id: f.get("entry_id") || null,
        visibility: f.get("visibility"),
        status: f.get("status"),
      })
      .eq("id", resource.id)
      .select("id")
      .single();
    if (error) setError(error.message);
    else await onDone();
    setBusy(false);
  }
  return (
    <Modal title="Edit attachment information" onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <p>{resource.name}</p>
        <AttachmentFields resource={resource} entries={entries} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="muted">
          To replace a file, upload its replacement and then remove the outdated
          attachment.
        </p>
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectUpdates({ entries }: { entries: Entry[] }) {
  return (
    <div className="updates-list">
      {entries
        .filter((e) => e.kind === "update")
        .slice(0, 6)
        .map((e) => (
          <Link key={e.id} href={`/updates/${e.id}`} className="research-row">
            <div className="timeline-node current">
              <span />
            </div>
            <div>
              <strong>{e.title}</strong>
              <span>
                {new Date(e.updated_at).toLocaleDateString()} · {e.status}
              </span>
              <p>{e.summary}</p>
            </div>
            <ChevronRight size={14} />
          </Link>
        ))}
    </div>
  );
}

function ImageGallery({
  resources,
  onOpen,
}: {
  resources: Resource[];
  onOpen: (r: Resource) => void;
}) {
  const images = resources.filter((r) => r.mime.startsWith("image/"));
  return images.length ? (
    <div className="image-gallery">
      {images.map((r) => (
        <ImageTile key={r.id} resource={r} onOpen={() => onOpen(r)} />
      ))}
    </div>
  ) : null;
}
function ImageTile({
  resource,
  onOpen,
}: {
  resource: Resource;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    supabase?.storage
      .from("research-files")
      .createSignedUrl(resource.path, 120)
      .then(({ data, error }) => {
        if (active) {
          if (error) setFailed(true);
          else setUrl(data.signedUrl);
        }
      });
    return () => {
      active = false;
    };
  }, [resource.path]);
  return (
    <button
      className="image-tile"
      onClick={onOpen}
      aria-label={`Enlarge ${resource.name}`}
    >
      <div>
        {url && !failed ? (
          <img
            src={url}
            alt={resource.caption || resource.name}
            onError={() => setFailed(true)}
          />
        ) : (
          <span>
            <ImageIcon size={24} />
            {failed ? "Preview unavailable" : "Loading image…"}
          </span>
        )}
        <span className="image-zoom">
          <Eye size={15} />
        </span>
      </div>
      <strong>{resource.caption || resource.name}</strong>
      <small>{resource.category || "Research image"} · Click to enlarge</small>
    </button>
  );
}
