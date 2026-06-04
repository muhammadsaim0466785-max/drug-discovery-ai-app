# Multi-Agent Drug Discovery Assistant — Project Milestones

> **Project Type:** AI-Powered Research Pipeline  
> **Stack:** Python · AutoGen · RDKit · PyTorch · FastAPI  
> **External APIs:** PubMed · ChEMBL · UniProt · PDB  
> **LLM Backbone:** Claude / GPT-4o  
> **Architecture:** 5-Agent Pipeline (Literature → Hypothesis → Molecular → Simulation → Report)

---

## Overview

A multi-agent system that automates the early-stage drug discovery workflow. Each agent owns a discrete scientific task; agents communicate sequentially, passing structured context downstream until a final report is generated.

```
PubMed Mining → Target Hypotheses → Molecule Generation → ADMET Simulation → Report
   [Lit Agent]    [Hypothesis Agent]   [Molecular Agent]   [Sim Agent]     [Report Agent]
```

---

## Milestone 0 — Project Foundation

**Goal:** Establish repo structure, tooling, and shared infrastructure.

**Deliverables:**
- Monorepo scaffold with `agents/`, `core/`, `api/`, `tests/`, `notebooks/`
- Python virtual environment with pinned dependencies (`requirements.txt` / `pyproject.toml`)
- `.env` template for all API keys (PubMed, ChEMBL, UniProt, PDB, Anthropic/OpenAI)
- Pre-commit hooks (black, ruff, mypy)
- Docker Compose file for local development
- CI pipeline (GitHub Actions) — lint + unit tests on push

**Acceptance Criteria:**
- [ ] `docker compose up` launches all services cleanly
- [ ] All linters pass on the empty scaffold
- [ ] Secrets loading validated via config module

**Estimated Effort:** 3–4 days

---

## Milestone 1 — Literature Agent

**Goal:** Autonomously mine PubMed for relevant research papers given a disease/target query.

**Agent Responsibilities:**
- Accept a user-supplied query (e.g., `"KRAS G12C inhibitors lung cancer"`)
- Query the **PubMed E-utilities API** (esearch + efetch)
- Parse and rank abstracts by relevance using embedding similarity
- Extract key entities: genes, proteins, pathways, existing drugs
- Emit a structured `LiteratureContext` object downstream

**Key Components:**

| Component | Technology |
|---|---|
| PubMed API client | `httpx` + async retry logic |
| Abstract parsing | spaCy NER + custom biomedical model |
| Relevance ranking | `sentence-transformers` (PubMedBERT) |
| Output schema | Pydantic `LiteratureContext` |

**Deliverables:**
- `agents/literature_agent.py` — AutoGen-compatible agent class
- `core/pubmed_client.py` — rate-limited async client (NCBI limit: 10 req/s)
- `core/entity_extractor.py` — NER pipeline
- Unit tests with mocked PubMed responses
- Jupyter notebook demo: end-to-end literature search

**Acceptance Criteria:**
- [ ] Returns ≥ 20 ranked abstracts for any valid biomedical query
- [ ] Entity extraction F1 ≥ 0.75 on a held-out test set
- [ ] Handles PubMed rate limits gracefully (exponential backoff)
- [ ] `LiteratureContext` serializes/deserializes cleanly to JSON

**Estimated Effort:** 1.5 weeks

---

## Milestone 2 — Hypothesis Agent

**Goal:** Propose novel drug targets based on literature context, enriched with UniProt and PDB data.

**Agent Responsibilities:**
- Consume `LiteratureContext` from the Literature Agent
- Query **UniProt API** to fetch protein sequence, function, and disease associations
- Query **PDB API** to retrieve available 3D structures and binding site info
- Use LLM (GPT-4o) to reason over evidence and rank candidate targets
- Emit a `HypothesisSet` — ranked list of (target, rationale, confidence_score)

**Key Components:**

| Component | Technology |
|---|---|
| UniProt client | REST API (`/uniprotkb/search`) |
| PDB client | RCSB REST API + PDBe Graph API |
| Target ranking | GPT-4o with chain-of-thought prompting |
| Output schema | Pydantic `HypothesisSet` |

**Deliverables:**
- `agents/hypothesis_agent.py`
- `core/uniprot_client.py`
- `core/pdb_client.py`
- `core/llm_reasoner.py` — prompt templates + LLM wrapper
- Prompt library in `prompts/hypothesis/`
- Evaluation notebook: hypothesis quality assessment

**Acceptance Criteria:**
- [ ] Generates ≥ 3 ranked targets with structured rationale for any `LiteratureContext`
- [ ] UniProt enrichment covers sequence length, function, and known disease links
- [ ] PDB lookup returns binding site residues when structure is available
- [ ] Confidence scores correlate with expert rankings on 10 test cases

**Estimated Effort:** 2 weeks

---

## Milestone 3 — Molecular Agent

**Goal:** Generate small-molecule drug candidates for each proposed target using RDKit and ChEMBL data.

**Agent Responsibilities:**
- Consume `HypothesisSet` (top N targets)
- Query **ChEMBL API** for known actives against each target
- Use RDKit for scaffold analysis and analog generation
- Apply PyTorch-based generative model (optional: REINVENT / graph VAE) to propose novel molecules
- Filter by drug-likeness: Lipinski Ro5, PAINS, QED score
- Emit `MoleculeSet` — list of candidate SMILES with metadata

**Key Components:**

| Component | Technology |
|---|---|
| ChEMBL client | `chembl_webresource_client` Python library |
| Molecular manipulation | RDKit (descriptors, scaffolds, substructure) |
| Generative model | PyTorch (REINVENT-style RNN or JTVAE) |
| Drug-likeness filters | RDKit Lipinski, PAINS filter, QED |
| Output schema | Pydantic `MoleculeSet` |

**Deliverables:**
- `agents/molecular_agent.py`
- `core/chembl_client.py`
- `core/molecule_generator.py` — RDKit + generative model integration
- `models/` — pretrained generative model weights + loading scripts
- `core/drug_filters.py` — Ro5, PAINS, QED pipeline
- Visualization notebook: molecule grid display with RDKit

**Acceptance Criteria:**
- [ ] Retrieves ≥ 50 known actives per target from ChEMBL (IC50 < 1 µM)
- [ ] Generates ≥ 20 novel analogs per scaffold passing all drug-likeness filters
- [ ] All output molecules are valid RDKit mol objects (no kekulization errors)
- [ ] QED score distribution of generated molecules ≥ 0.5 median

**Estimated Effort:** 2.5 weeks

---

## Milestone 4 — Simulation Agent (ADMET Predictions)

**Goal:** Run in-silico ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) profiling on all candidate molecules.

**Agent Responsibilities:**
- Consume `MoleculeSet`
- Predict ADMET properties using DeepChem / custom PyTorch models
- Properties covered:
  - **A:** Caco-2 permeability, solubility (ESOL)
  - **D:** plasma protein binding, VD
  - **M:** CYP450 inhibition (1A2, 2C9, 2C19, 2D6, 3A4)
  - **E:** renal clearance
  - **T:** hERG toxicity, Ames mutagenicity, LD50
- Score and rank molecules by combined ADMET profile
- Flag high-risk compounds
- Emit `SimulationReport` per molecule

**Key Components:**

| Component | Technology |
|---|---|
| ADMET model suite | DeepChem + custom PyTorch MPNN |
| Molecular featurization | RDKit Morgan fingerprints + graph features |
| Scoring function | Weighted multi-property optimization (MPO) |
| Output schema | Pydantic `SimulationReport` |

**Deliverables:**
- `agents/simulation_agent.py`
- `core/admet_predictor.py` — model ensemble wrapper
- `models/admet/` — trained model checkpoints per endpoint
- `core/mpo_scorer.py` — multi-property optimization scorer
- Performance benchmark notebook (vs. known ADMET datasets)

**Acceptance Criteria:**
- [ ] Predictions generated for all 10 ADMET endpoints per molecule
- [ ] CYP450 inhibition AUC ≥ 0.80 on ChEMBL validation set
- [ ] hERG toxicity prediction recall ≥ 0.85 (safety-critical)
- [ ] Full ADMET profile computed for 100 molecules in < 60 seconds

**Estimated Effort:** 2.5 weeks

---

## Milestone 5 — Report Agent

**Goal:** Synthesize all upstream outputs into a structured, human-readable drug discovery report.

**Agent Responsibilities:**
- Consume `LiteratureContext`, `HypothesisSet`, `MoleculeSet`, and `SimulationReport`
- Use GPT-4o to generate narrative sections with scientific citations
- Produce ranked shortlist of lead compounds with supporting evidence
- Generate visualizations: molecule structures, ADMET radar charts, target heatmaps
- Export report as PDF and structured JSON

**Key Components:**

| Component | Technology |
|---|---|
| Report generation | GPT-4o (long-context, structured output) |
| Molecular visualization | RDKit `Draw.MolsToGridImage` |
| ADMET charts | Matplotlib / Plotly |
| PDF export | WeasyPrint or ReportLab |
| JSON export | Pydantic serialization |

**Deliverables:**
- `agents/report_agent.py`
- `core/report_builder.py` — templating + LLM narrative generation
- `templates/report/` — Jinja2 HTML templates for PDF rendering
- Sample output report (PDF + JSON) for a demo target
- Report quality evaluation rubric

**Acceptance Criteria:**
- [ ] Report generated end-to-end in < 5 minutes for a 5-target, 50-molecule run
- [ ] Narrative sections are factually grounded (all claims traceable to upstream data)
- [ ] PDF renders cleanly with molecule images and charts
- [ ] JSON output validates against `DiscoveryReport` Pydantic schema

**Estimated Effort:** 1.5 weeks

---

## Milestone 6 — Agent Orchestration (AutoGen Multi-Agent Loop)

**Goal:** Wire all agents into a cohesive AutoGen-managed pipeline with error handling, retry logic, and human-in-the-loop checkpoints.

**Deliverables:**
- `pipeline/orchestrator.py` — AutoGen `GroupChat` / sequential pipeline controller
- Inter-agent message schemas (standardized `AgentMessage` envelope)
- Human approval checkpoint after Hypothesis Agent (optional gate)
- Global state manager — tracks pipeline run, stores intermediate artifacts
- Logging and observability: structured JSON logs, OpenTelemetry traces
- Retry + fallback logic for each agent failure mode

**Acceptance Criteria:**
- [ ] Full pipeline (M1–M5) runs end-to-end with a single `orchestrator.run(query)` call
- [ ] Human checkpoint correctly pauses and resumes on approval
- [ ] Any single agent failure does not crash the pipeline (graceful degradation)
- [ ] All intermediate artifacts persisted to disk after each agent completes

**Estimated Effort:** 1.5 weeks

---

## Milestone 7 — FastAPI Service Layer

**Goal:** Expose the pipeline as a production-ready REST API.

**Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/run` | Start a new discovery run |
| `GET` | `/api/v1/run/{run_id}` | Get run status + progress |
| `GET` | `/api/v1/run/{run_id}/report` | Download final report (PDF/JSON) |
| `GET` | `/api/v1/run/{run_id}/molecules` | Fetch molecule shortlist |
| `DELETE` | `/api/v1/run/{run_id}` | Cancel a run |
| `GET` | `/api/v1/health` | Service health check |

**Deliverables:**
- `api/main.py` — FastAPI app with lifespan management
- `api/routers/` — endpoint implementations
- `api/schemas/` — request/response Pydantic models
- Background task runner (Celery + Redis or FastAPI `BackgroundTasks`)
- OpenAPI docs auto-generated at `/docs`
- API integration tests (pytest + httpx)

**Acceptance Criteria:**
- [ ] `/api/v1/run` accepts query string and returns `run_id` within 500 ms
- [ ] Status endpoint reflects real-time agent progress
- [ ] Report download returns valid PDF binary
- [ ] API handles 10 concurrent runs without degradation
- [ ] All endpoints documented in OpenAPI spec

**Estimated Effort:** 1.5 weeks

---

## Milestone 8 — Evaluation, Benchmarking & Safety

**Goal:** Rigorously evaluate system quality and ensure scientific reliability.

**Evaluation Dimensions:**

| Dimension | Metric | Target |
|---|---|---|
| Literature relevance | Precision@20 | ≥ 0.80 |
| Target novelty | % not in prior reviews | ≥ 30% |
| Molecule validity | Valid SMILES rate | 100% |
| Drug-likeness | QED ≥ 0.5 rate | ≥ 60% |
| ADMET accuracy | Average AUC across endpoints | ≥ 0.80 |
| End-to-end latency | Time per full run | < 10 min |
| Report coherence | Human expert score (1–5) | ≥ 4.0 |

**Deliverables:**
- `evals/` — benchmark scripts and gold-standard datasets
- Evaluation report for 3 real disease targets (e.g., EGFR, BRAF, PCSK9)
- Hallucination detection layer for Report Agent outputs
- Toxicity safeguards: flag dual-use molecules, restricted scaffolds
- `SAFETY.md` — responsible use guidelines

**Acceptance Criteria:**
- [ ] All benchmark targets met or documented with remediation plan
- [ ] Zero hallucinated citations in 10 sampled reports (manual audit)
- [ ] Safety flags correctly identify known toxic scaffolds (e.g., mustargen analogs)

**Estimated Effort:** 2 weeks

---

## Milestone 9 — Documentation & Demo

**Goal:** Ship production-ready documentation and a public-facing demo.

**Deliverables:**
- `README.md` — quick start, architecture diagram, example output
- Full API reference (auto-generated from OpenAPI + mkdocs)
- Architecture decision records (`docs/adr/`)
- Jupyter notebook walkthrough: "Discovery Run in 15 Minutes"
- Recorded demo video (5 min) — screen capture of a full pipeline run
- `CONTRIBUTING.md` + issue templates

**Acceptance Criteria:**
- [ ] New engineer can run a full pipeline demo within 30 minutes of cloning the repo
- [ ] All public API endpoints documented with request/response examples
- [ ] Demo notebook executes top-to-bottom without errors

**Estimated Effort:** 1 week

---

## Timeline Summary

| Milestone | Description | Duration | Cumulative |
|---|---|---|---|
| M0 | Project Foundation | 4 days | Week 1 |
| M1 | Literature Agent | 1.5 weeks | Week 2–3 |
| M2 | Hypothesis Agent | 2 weeks | Week 4–5 |
| M3 | Molecular Agent | 2.5 weeks | Week 6–8 |
| M4 | Simulation Agent | 2.5 weeks | Week 9–11 |
| M5 | Report Agent | 1.5 weeks | Week 12–13 |
| M6 | Orchestration | 1.5 weeks | Week 14–15 |
| M7 | FastAPI Service | 1.5 weeks | Week 16–17 |
| M8 | Evaluation & Safety | 2 weeks | Week 18–19 |
| M9 | Docs & Demo | 1 week | **Week 20** |

> **Total estimated duration: ~20 weeks** (solo developer, full-time)  
> Parallelize M3+M4 and M6+M7 to compress to ~15 weeks with 2 developers.

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Agent framework | Microsoft AutoGen |
| LLM | GPT-4o (OpenAI API) |
| Cheminformatics | RDKit |
| Deep learning | PyTorch + DeepChem |
| API framework | FastAPI + Uvicorn |
| Task queue | Celery + Redis |
| Literature API | NCBI PubMed E-utilities |
| Chemical data | ChEMBL Web Services API |
| Protein data | UniProt REST API |
| Structure data | RCSB PDB REST API |
| NLP/NER | spaCy + `en_ner_bc5cdr_md` |
| Embeddings | `sentence-transformers` (PubMedBERT) |
| Testing | pytest + httpx + hypothesis |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Observability | OpenTelemetry + structured logging |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PubMed / ChEMBL API rate limits | High | Medium | Async client with exponential backoff + local caching layer |
| LLM hallucinations in Report Agent | Medium | High | Grounding checks, citation tracing, human review gate |
| Generative model produces invalid SMILES | Medium | Low | RDKit validity filter before any downstream use |
| ADMET model performance below threshold | Medium | High | Ensemble multiple public models; fall back to RDKit descriptors |
| GPT-4o latency degrades pipeline runtime | Low | Medium | Async parallel calls; cache repeated target lookups |
| Dual-use molecular generation | Low | Critical | SMARTS-based scaffold blocklist; mandatory safety review step |

---

*Last updated: June 2026*
