import { Client } from "@/types/revio";

export interface BrregBasis {
  navn?: string | null;
  organisasjonsform?: { kode?: string; beskrivelse?: string };
  email?: string | null;
  homepage?: string | null;
  telefon?: string | null;
  addressLines?: string[];
  kapital?: { equityCapital?: number; shareCapital?: number };
  kommune?: { kommunenummer?: string; navn?: string };
  postalCode?: string | null;
  city?: string | null;
  status?: string | null;
  naeringskode1?: { kode?: string; beskrivelse?: string };
  registreringsdatoEnhetsregisteret?: string;
}

export function fixValue(val: string | undefined | null): string | null {
  return val && String(val).trim().length > 0 ? val : null;
}

export function formatUpdateData(basis: any, roles: any, client: any) {
  const addressLines = Array.isArray(basis.addressLines) ? basis.addressLines : [];
  const addressLine = addressLines.length > 0 ? addressLines.join(", ") : null;
  const email = fixValue(basis.email);
  const homepage = fixValue(basis.homepage);
  const phone = fixValue(basis.telefon);

  // Properly extract capital values
  let equityCapital = basis.kapital?.equityCapital ?? null;
  let shareCapital = basis.kapital?.shareCapital ?? null;

  const municipalityCode = fixValue(basis.kommune?.kommunenummer);
  const municipalityName = fixValue(basis.kommune?.navn);

  // Extract CEO and Chair from roles
  const ceoName = roles?.ceo?.name ? fixValue(roles.ceo.name) : null;
  const chairName = roles?.chair?.name ? fixValue(roles.chair.name) : null;

  console.log("Processed CEO and Chair from roles:", { ceoName, chairName });

  return {
    name: fixValue(basis.navn) || client.name,
    company_name: fixValue(basis.navn) || client.companyName,
    org_form_code: fixValue(basis.organisasjonsform?.kode),
    org_form_description: fixValue(basis.organisasjonsform?.beskrivelse),
    homepage,
    status: fixValue(basis.status),
    nace_code: fixValue(basis.naeringskode1?.kode),
    nace_description: fixValue(basis.naeringskode1?.beskrivelse),
    industry: fixValue(basis.naeringskode1?.beskrivelse) || client.industry || null,
    municipality_code: municipalityCode,
    municipality_name: municipalityName,
    address: addressLine,
    address_line: addressLine,
    postal_code: fixValue(basis.postalCode),
    city: fixValue(basis.city),
    registration_date: basis.registreringsdatoEnhetsregisteret
      ? new Date(basis.registreringsdatoEnhetsregisteret).toISOString().split("T")[0]
      : client.registrationDate || null,
    email: email || client.email || null,
    phone: phone || client.phone || null,
    ceo: ceoName || client.ceo || null,
    chair: chairName || client.chair || null,
    equity_capital: equityCapital,
    share_capital: shareCapital,
  };
}

export function isDifferent(updateData: Record<string, any>, client: Client) {
  return Object.keys(updateData).some((key) => {
    const clientKey = key
      .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      .replace("address_line", "address");
    
    const currentVal = client[clientKey as keyof Client];
    
    if (
      (updateData[key] == null && (currentVal == null || currentVal === "")) ||
      updateData[key] === currentVal
    ) {
      return false;
    }
    return true;
  });
}
