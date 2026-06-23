import { NextResponse } from "next/server";

type PubChemProperty = {
  CID: number;
  MolecularFormula: string;
  MolecularWeight: number | string;
  CanonicalSMILES?: string;
  ConnectivitySMILES?: string;
  SMILES?: string;
};

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
      return NextResponse.json(
        { error: `PubChem could not find data for ${name}.` },
        { status: response.status === 404 ? 404 : 502 }
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
    return NextResponse.json(
      { error: "Unable to reach PubChem." },
      { status: 502 }
    );
  }
}
