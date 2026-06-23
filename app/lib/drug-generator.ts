export type ExistingDrug = {
  name: string;
  cid: number;
  molecularWeight: number;
  formula: string;
  smiles: string;
  logP: number;
  qed: number;
  toxicityRisk: "Low" | "Moderate" | "High";
};

export type CandidateDrug = {
  id: string;
  name: string;
  molecularWeight: number;
  formula: string;
  smiles: string;
  logP: number;
  qed: number;
  toxicityRisk: "Low" | "Moderate" | "High";
};

export type ComparisonRow = {
  metric: "QED" | "MW" | "toxicity" | "logP";
  existingValue: string | number;
  candidateValue: string | number;
  better: "existing" | "candidate" | "similar";
};

export type ComparisonResult = {
  improvements: string[];
  rows: ComparisonRow[];
  verdict: string;
};

export type DiscoveryResult = {
  disease: string;
  existing: ExistingDrug;
  candidate: CandidateDrug;
  comparison: ComparisonResult;
};

const diseaseDrugMap: Record<string, string> = {
  acidreflux: "Omeprazole",
  fever: "Paracetamol",
  headache: "Aspirin",
  pain: "Ibuprofen",
  inflammation: "Ibuprofen",
  allergy: "Loratadine",
  cough: "Dextromethorphan",
  cold: "Dextromethorphan",
  diabetes: "Metformin",
  dia: "Metformin",
  hypertension: "Lisinopril",
  bloodpressure: "Lisinopril",
  asthma: "Albuterol",
  infection: "Amoxicillin",
  bacterialinfection: "Amoxicillin",
  malaria: "Chloroquine",
  depression: "Fluoxetine",
  anxiety: "Diazepam",
  cholesterol: "Atorvastatin",
  migraine: "Sumatriptan",
  nausea: "Ondansetron",
  ulcer: "Omeprazole",
  flu: "Oseltamivir",
  covid: "Remdesivir",
  arthritis: "Ibuprofen",
  cancer: "Doxorubicin",
  heartdisease: "Atorvastatin",
};

const fallbackDrugNames = [
  "Aspirin",
  "Ibuprofen",
  "Metformin",
  "Lisinopril",
  "Albuterol",
  "Amoxicillin",
  "Doxorubicin",
  "Loratadine",
  "Atorvastatin",
  "Sumatriptan",
  "Ondansetron",
  "Omeprazole",
  "Fluoxetine",
];

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function estimateExistingQed(molecularWeight: number) {
  const weightScore = molecularWeight >= 120 && molecularWeight <= 420 ? 0.72 : 0.52;
  return Number(weightScore.toFixed(2));
}

function estimateExistingLogP(smiles: string) {
  const carbonCount = (smiles.match(/C/g) || []).length;
  const heteroCount = (smiles.match(/[NOS]/g) || []).length;
  const estimate = 0.8 + carbonCount * 0.18 - heteroCount * 0.12;
  return Number(Math.max(0.1, Math.min(5, estimate)).toFixed(2));
}

function estimateToxicityRisk(molecularWeight: number, logP: number) {
  if (molecularWeight > 500 || logP > 4.5) return "High";
  if (molecularWeight > 350 || logP > 3.2) return "Moderate";
  return "Low";
}

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function normalizeDisease(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveExistingDrugName(disease: string) {
  const normalizedDisease = normalizeDisease(disease);
  const exactMatch = diseaseDrugMap[normalizedDisease];

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = Object.entries(diseaseDrugMap).find(([key]) => {
    return normalizedDisease.includes(key) || key.includes(normalizedDisease);
  });

  if (partialMatch) {
    return partialMatch[1];
  }

  const hash = Array.from(normalizedDisease).reduce((sum, char) => {
    return sum + char.charCodeAt(0);
  }, 0);

  return fallbackDrugNames[hash % fallbackDrugNames.length];
}

export async function fetchExistingDrug(
  disease: string,
  baseUrl = getBaseUrl()
): Promise<ExistingDrug> {
  const drugName = resolveExistingDrugName(disease);
  const url = `${baseUrl}/api/pubchem?name=${encodeURIComponent(drugName)}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Unable to fetch ${drugName} from PubChem.`);
  }

  const molecularWeight = Number(data.molecularWeight);
  const smiles = data.smiles || "CCO";
  const logP = estimateExistingLogP(smiles);

  return {
    name: data.name,
    cid: Number(data.cid),
    molecularWeight,
    formula: data.formula,
    smiles,
    logP,
    qed: estimateExistingQed(molecularWeight),
    toxicityRisk: estimateToxicityRisk(molecularWeight, logP),
  };
}

export function generateCandidate(
  existing: ExistingDrug,
  disease: string
): CandidateDrug {
  const cleanedDisease = disease.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidateId = `DDA-${cleanedDisease.slice(0, 3).toUpperCase() || "GEN"}-${
    existing.cid
  }`;
  const tweakedSmiles = `${existing.smiles}N`;
  const molecularWeight = formatNumber(existing.molecularWeight + 14.03);
  const logP = formatNumber(Math.max(0.1, existing.logP - 0.35));
  const qed = formatNumber(Math.min(0.95, existing.qed + 0.12));
  const toxicityRisk = estimateToxicityRisk(molecularWeight, logP);

  return {
    id: candidateId,
    name: `${candidateId} candidate`,
    molecularWeight,
    formula: `${existing.formula}+NH`,
    smiles: tweakedSmiles,
    logP,
    qed,
    toxicityRisk,
  };
}

export function compareDrugs(
  existing: ExistingDrug,
  candidate: CandidateDrug
): ComparisonResult {
  const rows: ComparisonRow[] = [
    {
      metric: "QED",
      existingValue: existing.qed,
      candidateValue: candidate.qed,
      better:
        Math.abs(candidate.qed - existing.qed) < 0.03
          ? "similar"
          : candidate.qed > existing.qed
            ? "candidate"
            : "existing",
    },
    {
      metric: "MW",
      existingValue: existing.molecularWeight,
      candidateValue: candidate.molecularWeight,
      better:
        Math.abs(candidate.molecularWeight - existing.molecularWeight) < 10
          ? "similar"
          : candidate.molecularWeight < existing.molecularWeight
            ? "candidate"
            : "existing",
    },
    {
      metric: "toxicity",
      existingValue: existing.toxicityRisk,
      candidateValue: candidate.toxicityRisk,
      better:
        existing.toxicityRisk === candidate.toxicityRisk
          ? "similar"
          : candidate.toxicityRisk === "Low"
            ? "candidate"
            : "existing",
    },
    {
      metric: "logP",
      existingValue: existing.logP,
      candidateValue: candidate.logP,
      better:
        Math.abs(candidate.logP - existing.logP) < 0.2
          ? "similar"
          : candidate.logP >= 1 && candidate.logP <= 3
            ? "candidate"
            : "existing",
    },
  ];

  const improvements = rows
    .filter((row) => row.better === "candidate")
    .map((row) => `Candidate improves ${row.metric}.`);

  const verdict =
    improvements.length >= 2
      ? "The AI candidate looks promising for early screening, but it still needs real lab validation."
      : "The existing drug remains stronger in this mock screen, though the AI candidate may be worth optimizing.";

  return {
    improvements:
      improvements.length > 0
        ? improvements
        : ["No clear candidate improvements in this mock comparison."],
    rows,
    verdict,
  };
}

export async function runDrugDiscovery(
  disease: string,
  baseUrl?: string
): Promise<DiscoveryResult> {
  const existing = await fetchExistingDrug(disease, baseUrl);
  const candidate = generateCandidate(existing, disease);
  const comparison = compareDrugs(existing, candidate);

  return {
    disease,
    existing,
    candidate,
    comparison,
  };
}
