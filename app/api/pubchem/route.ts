import { NextResponse } from "next/server";

type PubChemProperty = {
  CID: number;
  MolecularFormula: string;
  MolecularWeight: number | string;
  CanonicalSMILES?: string;
  ConnectivitySMILES?: string;
  SMILES?: string;
};

const fallbackDrugs: Record<
  string,
  {
    cid: number;
    molecularWeight: number;
    formula: string;
    smiles: string;
  }
> = {
  albuterol: {
    cid: 2083,
    molecularWeight: 239.31,
    formula: "C13H21NO3",
    smiles: "CC(C)(C)NCC(C1=CC(=C(C=C1)O)CO)O",
  },
  amoxicillin: {
    cid: 33613,
    molecularWeight: 365.4,
    formula: "C16H19N3O5S",
    smiles: "CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(C=C3)O)N)C(=O)O)C",
  },
  aspirin: {
    cid: 2244,
    molecularWeight: 180.16,
    formula: "C9H8O4",
    smiles: "CC(=O)OC1=CC=CC=C1C(=O)O",
  },
  atorvastatin: {
    cid: 60823,
    molecularWeight: 558.64,
    formula: "C33H35FN2O5",
    smiles: "CC(C)C1=C(C(=C(N1CC(CC(O)=O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",
  },
  chloroquine: {
    cid: 2719,
    molecularWeight: 319.87,
    formula: "C18H26ClN3",
    smiles: "CCN(CC)CCCC(C)NC1=C2C=CC(=CC2=NC=C1)Cl",
  },
  dextromethorphan: {
    cid: 5360696,
    molecularWeight: 271.4,
    formula: "C18H25NO",
    smiles: "COC1=CC=C2C3CC4CCN(C)CCC4C3CCC2=C1",
  },
  doxorubicin: {
    cid: 31703,
    molecularWeight: 543.52,
    formula: "C27H29NO11",
    smiles: "COC1=C(C=C2C(=C1)C(=O)C3=C(C2=O)C(=CC=C3O)OC4CC(C(C(O4)C)N)O)O",
  },
  diazepam: {
    cid: 3016,
    molecularWeight: 284.74,
    formula: "C16H13ClN2O",
    smiles: "CN1C(=O)CN=C(C2=CC=CC=C2)C3=C1C=CC(=C3)Cl",
  },
  fluoxetine: {
    cid: 3386,
    molecularWeight: 309.33,
    formula: "C17H18F3NO",
    smiles: "CNCCC(OC1=CC=C(C=C1)C(F)(F)F)C2=CC=CC=C2",
  },
  ibuprofen: {
    cid: 3672,
    molecularWeight: 206.28,
    formula: "C13H18O2",
    smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
  },
  lisinopril: {
    cid: 5362119,
    molecularWeight: 405.49,
    formula: "C21H31N3O5",
    smiles: "C1CCN(C1)C(C(=O)N2CCCC2C(=O)O)CCC3=CC=CC=C3",
  },
  loratadine: {
    cid: 3957,
    molecularWeight: 382.88,
    formula: "C22H23ClN2O2",
    smiles: "CCOC(=O)N1CCC(=C2C3=CC=CC=C3CC4=C2N=CC=C4)CC1",
  },
  metformin: {
    cid: 4091,
    molecularWeight: 129.16,
    formula: "C4H11N5",
    smiles: "CN(C)C(=N)N=C(N)N",
  },
  omeprazole: {
    cid: 4594,
    molecularWeight: 345.42,
    formula: "C17H19N3O3S",
    smiles: "COC1=CC2=C(C=C1OC)N=C(N2)S(=O)CC3=NC=C(C(=C3C)OC)C",
  },
  ondansetron: {
    cid: 4595,
    molecularWeight: 293.36,
    formula: "C18H19N3O",
    smiles: "CC1=C(C(=O)N2CCCCC2=N1)CN3C=NC=C3",
  },
  oseltamivir: {
    cid: 65028,
    molecularWeight: 312.4,
    formula: "C16H28N2O4",
    smiles: "CCC(CC)OC1C=C(CC(C1NC(=O)C)N)C(=O)OCC",
  },
  paracetamol: {
    cid: 1983,
    molecularWeight: 151.16,
    formula: "C8H9NO2",
    smiles: "CC(=O)NC1=CC=C(C=C1)O",
  },
  remdesivir: {
    cid: 121304016,
    molecularWeight: 602.58,
    formula: "C27H35N6O8P",
    smiles: "CCC(CC)OC(=O)N[P](=O)(OC1CC(C(C(O1)N2C=NC3=C2N=CN=C3N)O)O)OC4=CC=CC=C4",
  },
  sumatriptan: {
    cid: 5358,
    molecularWeight: 295.4,
    formula: "C14H21N3O2S",
    smiles: "CN(C)CCN1C=C(C2=CC=CC=C21)CS(=O)(=O)N",
  },
};

function getFallbackDrug(name: string) {
  return fallbackDrugs[name.toLowerCase()];
}

function fallbackResponse(name: string) {
  const fallback = getFallbackDrug(name);

  if (!fallback) {
    return null;
  }

  return NextResponse.json({
    name,
    cid: fallback.cid,
    molecularWeight: fallback.molecularWeight,
    formula: fallback.formula,
    smiles: fallback.smiles,
    source: "fallback",
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Missing required query parameter: name" },
      { status: 400 }
    );
  }

  const pubChemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
    name
  )}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;

  try {
    const response = await fetch(pubChemUrl, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return (
        fallbackResponse(name) ||
        NextResponse.json(
        { error: `PubChem could not find data for ${name}.` },
        { status: response.status === 404 ? 404 : 502 }
        )
      );
    }

    const data = await response.json();
    const property = data?.PropertyTable?.Properties?.[0] as
      | PubChemProperty
      | undefined;

    if (!property) {
      return NextResponse.json(
        { error: `No PubChem properties found for ${name}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name,
      cid: property.CID,
      molecularWeight: Number(property.MolecularWeight),
      formula: property.MolecularFormula,
      smiles:
        property.CanonicalSMILES ||
        property.ConnectivitySMILES ||
        property.SMILES ||
        "",
    });
  } catch {
    return (
      fallbackResponse(name) ||
      NextResponse.json(
      { error: "Unable to reach PubChem." },
      { status: 502 }
      )
    );
  }
}
