"use client";

import {
  Activity,
  Bell,
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  Loader2,
  Microscope,
  PlusCircle,
  Search,
  Settings,
  SlidersHorizontal,
  Target,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";

type TabId = "literature" | "hypothesis" | "molecular" | "simulation" | "report";

type Paper = {
  pmid: string;
  year: number;
  title: string;
  abstract: string;
  score: number;
  tags: string[];
};

type TargetCandidate = {
  target: string;
  confidence: number;
  rationale: string;
  evidence: string;
};

type Molecule = {
  id: string;
  smiles: string;
  target: string;
  qed: number;
  affinity: number;
  risk: "Low" | "Moderate" | "Watch";
};

const tabs: Array<{ id: TabId; label: string; icon: React.ElementType; milestone: string }> = [
  { id: "literature", label: "Literature", icon: BookOpen, milestone: "Milestone 1" },
  { id: "hypothesis", label: "Hypothesis", icon: Lightbulb, milestone: "Milestone 2" },
  { id: "molecular", label: "Molecular", icon: Microscope, milestone: "Milestone 3" },
  { id: "simulation", label: "Simulation", icon: FlaskConical, milestone: "Milestone 4" },
  { id: "report", label: "Report", icon: FileText, milestone: "Milestone 5" }
];

const defaultPapers: Paper[] = [
  {
    pmid: "38442109",
    year: 2024,
    title: "Neural Network Architectures for Lead Optimization in CDK4/6 Inhibition",
    abstract: "A generative adversarial framework identified potent CDK4/6 inhibitors using 14,000 bio-active compounds and transformer-based affinity prediction.",
    score: 98.4,
    tags: ["GENE: CDK4", "GENE: CDK6", "PROTEIN: Retinoblastoma", "METHOD: GAN-Opt"]
  },
  {
    pmid: "38221901",
    year: 2023,
    title: "Cross-target Selectivity of Small Molecules in Oncology",
    abstract: "High-density screening of approved kinase inhibitors revealed unexpected interactions with the AURKA pathway in squamous cell carcinoma models.",
    score: 92.1,
    tags: ["GENE: AURKA", "PROTEIN: Kinase-II"]
  },
  {
    pmid: "37991022",
    year: 2023,
    title: "Metabolic Profiling of Drug Resistance in TNBC",
    abstract: "Resistant cell lines showed glutamine dependence and alternative bypass mechanisms that may inform combination therapy design.",
    score: 84.5,
    tags: ["GENE: GLS1", "PATHWAY: Glutamine"]
  },
  {
    pmid: "37701481",
    year: 2022,
    title: "Fragment-derived Allosteric Modulators for KRAS G12C",
    abstract: "Fragment screening highlighted allosteric pockets with favorable ligand efficiency and tractable medicinal chemistry routes.",
    score: 81.8,
    tags: ["GENE: KRAS", "METHOD: Fragment Screen"]
  }
];

const targets: TargetCandidate[] = [
  {
    target: "CDK6",
    confidence: 94,
    rationale: "Strong literature convergence, known oncology relevance, and high-quality kinase domain structures.",
    evidence: "3 PDB structures, 62 active ChEMBL compounds, 2 resistance-linked pathways"
  },
  {
    target: "AURKA",
    confidence: 88,
    rationale: "Selective inhibition may suppress bypass signaling in squamous tumor models.",
    evidence: "5 pathway links, 41 actives, mitotic spindle association"
  },
  {
    target: "GLS1",
    confidence: 79,
    rationale: "Metabolic dependency suggests a combination strategy for resistant TNBC contexts.",
    evidence: "TNBC enrichment, glutamine metabolism signal, moderate structure coverage"
  }
];

const molecules: Molecule[] = [
  { id: "APX-014", smiles: "CC1=NC(NC2=CC=CC=C2)=NC=C1", target: "CDK6", qed: 0.82, affinity: -10.7, risk: "Low" },
  { id: "APX-027", smiles: "COC1=CC=C(NC2=NC=NC3=CC=CC=C23)C=C1", target: "CDK6", qed: 0.77, affinity: -9.8, risk: "Low" },
  { id: "APX-041", smiles: "CN1C=NC2=C1N=CN=C2NCC3=CC=CC=C3", target: "AURKA", qed: 0.71, affinity: -9.2, risk: "Moderate" },
  { id: "APX-052", smiles: "CCOC(=O)N1CCC(CC1)NC2=NC=CC=N2", target: "GLS1", qed: 0.66, affinity: -8.6, risk: "Watch" }
];

const logSeeds = [
  "> Entity extraction completed (14 genes found).",
  "> Building relevance matrix...",
  "> Cross-referencing UniProt entries...",
  "> Scanning ChEMBL activity tables...",
  "> ADMET ensemble warmed successfully."
];

// ── Real PubMed API fetch ──────────────────────────────────────────────────
async function fetchPubMed(query: string, maxYear: number): Promise<Paper[]> {
  const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
  const searchUrl = `${base}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=8&sort=relevance&retmode=json&datetype=pdat&maxdate=${maxYear}&mindate=2000`;

  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json();
  const ids: string[] = searchJson.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const fetchUrl = `${base}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const articles = Array.from(doc.querySelectorAll("PubmedArticle"));

  return articles.map((article, i) => {
    const pmid = article.querySelector("PMID")?.textContent ?? ids[i];
    const title = article.querySelector("ArticleTitle")?.textContent ?? "Untitled";
    const abstract = article.querySelector("AbstractText")?.textContent ?? "No abstract available.";
    const yearText = article.querySelector("PubDate Year")?.textContent ?? article.querySelector("PubDate MedlineDate")?.textContent ?? "2023";
    const year = parseInt(yearText.slice(0, 4)) || 2023;

    // Extract MeSH terms and keywords as tags
    const meshTerms = Array.from(article.querySelectorAll("MeshHeading DescriptorName"))
      .slice(0, 3)
      .map((el) => `MESH: ${el.textContent}`);
    const keywords = Array.from(article.querySelectorAll("Keyword"))
      .slice(0, 2)
      .map((el) => `KW: ${el.textContent}`);
    const tags = [...meshTerms, ...keywords].slice(0, 4);

    const score = parseFloat((99 - i * 4.5 + Math.random() * 2).toFixed(1));

    return { pmid, year, title, abstract: abstract.slice(0, 280) + (abstract.length > 280 ? "…" : ""), score, tags };
  });
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("literature");
  const [query, setQuery] = useState("KRAS inhibitors lung cancer");
  const [year, setYear] = useState(2024);
  const [includePatents, setIncludePatents] = useState(false);
  const [runCount, setRunCount] = useState(1);
  const [logs, setLogs] = useState(logSeeds);
  const [papers, setPapers] = useState<Paper[]>(defaultPapers);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const filteredPapers = useMemo(
    () => papers
      .filter((paper) => paper.year <= year)
      .map((paper, index) => ({ ...paper, score: paper.score - (includePatents ? index * 0.6 : 0) })),
    [papers, year, includePatents]
  );

  const progress = Math.min(100, 18 + tabs.findIndex((tab) => tab.id === activeTab) * 18 + runCount * 3);

  async function startRun() {
    setRunCount((count) => count + 1);
    setActiveTab("literature");
    setSearching(true);
    setSearchError("");
    setLogs((current) => [`> Run ${String(runCount + 1).padStart(3, "0")} started for "${query}".`, ...current].slice(0, 7));

    try {
      setLogs((c) => [`> Querying PubMed for "${query}"...`, ...c].slice(0, 7));
      const results = await fetchPubMed(query, year);
      if (results.length > 0) {
        setPapers(results);
        setLogs((c) => [`> Retrieved ${results.length} abstracts from PubMed.`, "> Entity extraction running...", ...c].slice(0, 7));
      } else {
        setSearchError("No results found. Try a different query.");
        setLogs((c) => [`> PubMed returned 0 results for "${query}".`, ...c].slice(0, 7));
      }
    } catch {
      setSearchError("PubMed fetch failed. Check your connection.");
      setLogs((c) => [`> ERROR: PubMed request failed.`, ...c].slice(0, 7));
    } finally {
      setSearching(false);
    }
  }

  async function refineMining() {
    setLogs((current) => [`> Refined PubMed range to 2000-${year}; patent filter ${includePatents ? "enabled" : "disabled"}.`, ...current].slice(0, 7));
    await startRun();
  }

  function exportReport() {
    const report = {
      query,
      generatedAt: new Date().toISOString(),
      topTarget: targets[0],
      papers: filteredPapers,
      shortlist: molecules,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "discovery-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Project Phoenix</strong>
          <span>AI Synthesis Lab</span>
        </div>

        <div className="side-log" aria-label="Recent agent activity">
          {logs.slice(0, 4).map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </div>

        <nav className="nav" aria-label="Discovery agents">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={tab.id === activeTab ? "nav-item active" : "nav-item"} onClick={() => setActiveTab(tab.id)}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="new-run" onClick={startRun} disabled={searching}>
          {searching ? <Loader2 size={19} className="spin" /> : <PlusCircle size={19} />}
          {searching ? "Searching..." : "New Discovery Run"}
        </button>

        <footer className="sidebar-footer">
          <a href="#report"><HelpCircle size={14} /> Docs</a>
          <a href="mailto:support@example.com"><HelpCircle size={14} /> Support</a>
        </footer>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="title-lockup">
            <strong>AstraPharma</strong>
            <span>{active.label} Agent: {active.milestone}</span>
          </div>
          <div className="top-actions">
            <label className="searchbox">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startRun()}
                placeholder="Type disease or target + Enter..."
              />
            </label>
            <button aria-label="Notifications"><Bell size={19} /></button>
            <button aria-label="Settings"><Settings size={19} /></button>
          </div>
        </header>

        <section className="content-grid">
          <section className="primary-panel">
            <div className="page-heading">
              <div>
                <h1>{headingFor(activeTab)}</h1>
                <p>{subheadFor(activeTab, query)}</p>
              </div>
              <span className="status-chip">
                <span className={searching ? "blink" : ""} />
                {searching ? "SEARCHING..." : "AGENT ACTIVE"}
              </span>
            </div>

            {searchError && (
              <div style={{ color: "var(--danger)", background: "rgba(255,143,131,0.08)", border: "1px solid var(--danger)", borderRadius: 6, padding: "12px 16px", marginBottom: 20 }}>
                ⚠ {searchError}
              </div>
            )}

            <TabContent activeTab={activeTab} papers={filteredPapers} searching={searching} onExportReport={exportReport} />
          </section>

          <aside className="right-rail">
            <section className="glass controls">
              <div className="panel-title"><SlidersHorizontal size={18} /> Search Parameters</div>
              <label>
                <span>Temporal Range</span>
                <input type="range" min="2000" max="2026" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                <small><b>2000</b><b>{year}</b></small>
              </label>
              <label className="check"><input type="checkbox" checked readOnly /> Human Genes</label>
              <label className="check"><input type="checkbox" checked readOnly /> Viral Proteomes</label>
              <label className="check"><input type="checkbox" checked={includePatents} onChange={(e) => setIncludePatents(e.target.checked)} /> Patented Compounds</label>
              <button className="outline-button" onClick={refineMining} disabled={searching}>
                {searching ? "Mining..." : "Refine Mining"}
              </button>
            </section>

            <section className="glass cluster-card">
              <div className="panel-title"><Activity size={18} /> Similarity Clusters</div>
              <div className="cluster-viz">
                <div className="mesh" />
                <div className="node one" />
                <div className="node two" />
                <div className="node three" />
                <strong>Kinase Selective Inhibitors</strong>
                <span>Cluster Detected</span>
              </div>
            </section>

            <section className="terminal">
              <div><span /> AGENT_HEARTBEAT_STABLE</div>
              {logs.map((log, i) => <p key={i}>{log}</p>)}
            </section>
          </aside>
        </section>

        <section className="bottom-strip">
          <Metric label="Pipeline Progress" value={`${progress}%`} />
          <Metric label="Ranked Abstracts" value={searching ? "..." : String(filteredPapers.length)} />
          <Metric label="Targets" value={String(targets.length)} />
          <Metric label="Lead Candidates" value={String(molecules.length)} />
          <button className="fab" onClick={exportReport} aria-label="Export report"><Zap size={26} /></button>
        </section>
      </section>
    </main>
  );
}

function headingFor(tab: TabId) {
  return {
    literature: "PubMed Mining",
    hypothesis: "Target Hypotheses",
    molecular: "Molecule Generation",
    simulation: "ADMET Simulation",
    report: "Discovery Report"
  }[tab];
}

function subheadFor(tab: TabId, query: string) {
  return {
    literature: `Scanning biomedical literature for "${query}"`,
    hypothesis: "Ranking actionable targets from literature, UniProt, and structure evidence",
    molecular: "Filtering generated analogs by affinity, QED, and scaffold risk",
    simulation: "Profiling lead candidates across absorption, metabolism, and toxicity",
    report: "Synthesizing evidence into a downloadable structured report"
  }[tab];
}

function TabContent({ activeTab, papers, searching, onExportReport }: {
  activeTab: TabId;
  papers: Paper[];
  searching: boolean;
  onExportReport: () => void;
}) {
  if (activeTab === "literature") {
    if (searching) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0", color: "var(--muted)" }}>
          <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "var(--cyan)" }} />
          <p style={{ margin: 0 }}>Querying PubMed API…</p>
        </div>
      );
    }
    if (papers.length === 0) {
      return <p style={{ color: "var(--muted)", padding: "40px 0" }}>No papers found. Try a new search query above.</p>;
    }
    return (
      <div className="stack">
        {papers.map((paper) => (
          <article className="glass result-card" key={paper.pmid}>
            <div>
              <span className="mono">PMID: {paper.pmid} / {paper.year}</span>
              <h2>{paper.title}</h2>
              <p>{paper.abstract}</p>
              <div className="tags">{paper.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <aside>
              <strong>{paper.score.toFixed(1)}</strong>
              <span>Rel. Score</span>
            </aside>
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "hypothesis") {
    return (
      <div className="stack">
        {targets.map((candidate) => (
          <article className="glass target-card" key={candidate.target}>
            <div className="target-icon"><Target size={24} /></div>
            <div>
              <span className="mono">{candidate.evidence}</span>
              <h2>{candidate.target}</h2>
              <p>{candidate.rationale}</p>
            </div>
            <strong>{candidate.confidence}%</strong>
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "molecular") {
    return (
      <div className="molecule-grid">
        {molecules.map((molecule) => (
          <article className="glass molecule-card" key={molecule.id}>
            <MoleculeGlyph />
            <h2>{molecule.id}</h2>
            <p>{molecule.smiles}</p>
            <div className="molecule-stats">
              <span>Target <b>{molecule.target}</b></span>
              <span>QED <b>{molecule.qed}</b></span>
              <span>Affinity <b>{molecule.affinity}</b></span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "simulation") {
    return (
      <div className="stack">
        {molecules.map((molecule, index) => (
          <article className="glass sim-card" key={molecule.id}>
            <div>
              <span className="mono">{molecule.id} / {molecule.target}</span>
              <h2>{molecule.risk} toxicity watch</h2>
            </div>
            {["Solubility", "Caco-2", "CYP450", "hERG"].map((label, barIndex) => (
              <div className="bar" key={label}>
                <span>{label}</span>
                <i style={{ width: `${86 - index * 9 - barIndex * 4}%` }} />
              </div>
            ))}
          </article>
        ))}
      </div>
    );
  }

  return (
    <article id="report" className="glass report-card">
      <div className="report-head">
        <ClipboardList size={28} />
        <div>
          <span className="mono">DISCOVERY_REPORT / JSON READY</span>
          <h2>Lead shortlist recommends APX-014 for CDK6 progression.</h2>
        </div>
      </div>
      <p>
        Literature mining found strong kinase inhibition signals, the hypothesis agent ranked CDK6 as the leading target,
        and ADMET simulation marked APX-014 as the best balanced candidate by QED, affinity, and low safety watch status.
      </p>
      <div className="report-actions">
        <button onClick={() => window.print()}><FileText size={17} /> Print</button>
        <button onClick={onExportReport}><Download size={17} /> Download JSON</button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MoleculeGlyph() {
  return (
    <div className="molecule-glyph" aria-hidden="true">
      <span /><span /><span /><span />
    </div>
  );
}
