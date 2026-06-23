"use client";

import { FormEvent, useEffect, useState } from "react";

type Drug = {
  name: string;
  cid?: number | string;
  molecularWeight: number;
  formula?: string;
  smiles: string;
  logP?: number;
  qed?: number;
  toxicityRisk?: string;
};

type ComparisonRow = {
  metric: string;
  existingValue: string | number;
  candidateValue: string | number;
  better: "existing" | "candidate" | "similar";
};

type DiscoveryResult = {
  disease: string;
  existing: Drug;
  candidate: Drug & {
    id: string;
    formula: string;
    logP: number;
    qed: number;
    toxicityRisk: string;
  };
  comparison: {
    improvements: string[];
    rows: ComparisonRow[];
    verdict: string;
  };
};

export default function Home() {
  const [disease, setDisease] = useState("fever");
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runDiscovery(nextDisease: string) {
    const trimmedDisease = nextDisease.trim();
    if (!trimmedDisease) {
      setError("Enter a disease name first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/discover?disease=${encodeURIComponent(trimmedDisease)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Drug discovery request failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runDiscovery("fever");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runDiscovery(disease);
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <p style={styles.eyebrow}>Drug Discovery AI</p>
        <h1 style={styles.title}>Compare a known drug with an AI candidate.</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            aria-label="Disease name"
            value={disease}
            onChange={(event) => setDisease(event.target.value)}
            placeholder="Enter disease, e.g. fever"
            style={styles.input}
          />
          <button disabled={loading} style={styles.button}>
            {loading ? "Generating..." : "Generate Drug"}
          </button>
        </form>
        {loading ? <p style={styles.status}>Searching PubChem and generating a candidate...</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}
        {!loading && result ? (
          <p style={styles.status}>Showing discovery result for {result.disease}.</p>
        ) : null}
      </section>

      {result ? (
        <section style={styles.results}>
          <article style={styles.card}>
            <p style={styles.label}>Existing Drug</p>
            <h2 style={styles.cardTitle}>{result.existing.name}</h2>
            <dl style={styles.details}>
              <div>
                <dt>Formula</dt>
                <dd>{result.existing.formula}</dd>
              </div>
              <div>
                <dt>MW</dt>
                <dd>{result.existing.molecularWeight}</dd>
              </div>
              <div>
                <dt>CID</dt>
                <dd>{result.existing.cid}</dd>
              </div>
              <div>
                <dt>SMILES</dt>
                <dd style={styles.smiles}>{result.existing.smiles}</dd>
              </div>
            </dl>
          </article>

          <article style={styles.card}>
            <p style={styles.label}>AI Generated Candidate</p>
            <h2 style={styles.cardTitle}>{result.candidate.name}</h2>
            <dl style={styles.details}>
              <div>
                <dt>Formula</dt>
                <dd>{result.candidate.formula}</dd>
              </div>
              <div>
                <dt>MW</dt>
                <dd>{result.candidate.molecularWeight}</dd>
              </div>
              <div>
                <dt>ID</dt>
                <dd>{result.candidate.id}</dd>
              </div>
              <div>
                <dt>SMILES</dt>
                <dd style={styles.smiles}>{result.candidate.smiles}</dd>
              </div>
            </dl>
          </article>

          <article style={{ ...styles.card, ...styles.fullWidth }}>
            <p style={styles.label}>Comparison</p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Metric</th>
                  <th style={styles.th}>Existing</th>
                  <th style={styles.th}>AI Candidate</th>
                  <th style={styles.th}>Better</th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.rows.map((row) => (
                  <tr key={row.metric}>
                    <td style={styles.td}>{row.metric}</td>
                    <td style={styles.td}>{row.existingValue}</td>
                    <td style={styles.td}>{row.candidateValue}</td>
                    <td style={styles.td}>{row.better}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article style={{ ...styles.card, ...styles.fullWidth }}>
            <p style={styles.label}>Verdict</p>
            <h2 style={styles.cardTitle}>{result.comparison.verdict}</h2>
            <ul style={styles.list}>
              {result.comparison.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "48px 20px",
    background: "#f5f7fb",
    color: "#14213d",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  header: {
    maxWidth: "960px",
    margin: "0 auto 28px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#2f6fed",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 22px",
    maxWidth: "720px",
    fontSize: "clamp(32px, 6vw, 56px)",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  input: {
    flex: "1 1 260px",
    minHeight: "48px",
    padding: "0 14px",
    border: "1px solid #c9d3e6",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#14213d",
  },
  button: {
    minHeight: "48px",
    padding: "0 20px",
    border: "0",
    borderRadius: "8px",
    background: "#2f6fed",
    color: "#ffffff",
    fontWeight: 700,
  },
  error: {
    color: "#b42318",
    fontWeight: 700,
  },
  status: {
    margin: "14px 0 0",
    color: "#475569",
    fontWeight: 700,
  },
  results: {
    maxWidth: "960px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "22px",
    border: "1px solid #d9e1ef",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(20, 33, 61, 0.08)",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  label: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  cardTitle: {
    margin: "0 0 16px",
    fontSize: "24px",
  },
  details: {
    display: "grid",
    gap: "12px",
    margin: 0,
  },
  smiles: {
    overflowWrap: "anywhere",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px",
    borderBottom: "1px solid #d9e1ef",
    color: "#64748b",
    textAlign: "left",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
  },
};
