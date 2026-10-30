export const CANONICAL_GEOGRAPHY: Record<string, Record<string, string[]>> = {
  'Batan Island': {
    Basco: [
      'Chanarian',
      'Kayhuvokan (Santa Rosa)',
      'Kayvaluganan',
      'San Antonio',
      'San Joaquin',
      'Santo Domingo (Ihubok II)',
    ],
    Mahatao: ['Hanheng', 'Kaumbakan', 'Panatayan', 'Uvoy'],
    Ivana: ['Radiwan', 'Salagao', 'San Vicente (Igang)', 'Tuhel'],
    Uyugan: ['Imnajbu', 'Itbud', 'Kayvaluganan (Kayuganan)', 'Kaybatbatan'],
  },
  'Sabtang Island': {
    Sabtang: ['Chavayan', 'Malakdang', 'Nakanmuan', 'Savidug', 'Sinakan', 'Sumnanga'],
  },
  'Itbayat Island': {
    Itbayat: [
      'Raele',
      'San Rafael (Idiang)',
      'Santa Lucia (Kauhauhasan)',
      'Santa Maria (Marapuy)',
      'Santa Rosa (Kaynatuan)',
    ],
  },
};

export const MUNICIPALITY_TO_ISLAND: Record<string, string> = {
  Basco: 'Batan Island',
  Mahatao: 'Batan Island',
  Ivana: 'Batan Island',
  Uyugan: 'Batan Island',
  Sabtang: 'Sabtang Island',
  Itbayat: 'Itbayat Island',
};

export const ALL_MUNICIPALITIES: string[] = Object.keys(MUNICIPALITY_TO_ISLAND);

export function resolveIsland(municipality: string | null | undefined): string | null {
  if (!municipality) return null;
  const clean = municipality.trim().toLowerCase();
  for (const [canonicalMun, island] of Object.entries(MUNICIPALITY_TO_ISLAND)) {
    if (canonicalMun.toLowerCase() === clean) {
      return island;
    }
  }
  return null;
}

export function getCanonicalMunicipality(municipality: string | null | undefined): string | null {
  if (!municipality) return null;
  const clean = municipality.trim().toLowerCase();
  for (const canonicalMun of ALL_MUNICIPALITIES) {
    if (canonicalMun.toLowerCase() === clean) {
      return canonicalMun;
    }
  }
  return null;
}

export function getCanonicalBarangay(
  municipality: string | null | undefined,
  barangay: string | null | undefined
): string | null {
  const canonicalMun = getCanonicalMunicipality(municipality);
  if (!canonicalMun || !barangay) return null;

  const island = MUNICIPALITY_TO_ISLAND[canonicalMun];
  const barangays = CANONICAL_GEOGRAPHY[island]?.[canonicalMun] || [];
  const cleanBgy = barangay.trim().toLowerCase();

  for (const canonicalBgy of barangays) {
    const cLower = canonicalBgy.toLowerCase();
    if (cLower === cleanBgy) {
      return canonicalBgy;
    }
    // Check composite parts, e.g. "Kayhuvokan (Santa Rosa)" -> "Kayhuvokan", "Santa Rosa"
    if (canonicalBgy.includes('(') && canonicalBgy.includes(')')) {
      const parts = canonicalBgy.split('(');
      const mainPart = parts[0].trim().toLowerCase();
      const parenPart = parts[1].split(')')[0].trim().toLowerCase();
      if (cleanBgy === mainPart || cleanBgy === parenPart) {
        return canonicalBgy;
      }
    }
  }

  return null;
}

export interface LocationValidationResult {
  isValid: boolean;
  canonicalIsland: string | null;
  canonicalMunicipality: string | null;
  canonicalBarangay: string | null;
}

export function validateLocation(
  municipality: string | null | undefined,
  barangay: string | null | undefined = null
): LocationValidationResult {
  const canonicalMun = getCanonicalMunicipality(municipality);
  if (!canonicalMun) {
    return { isValid: false, canonicalIsland: null, canonicalMunicipality: null, canonicalBarangay: null };
  }

  const island = MUNICIPALITY_TO_ISLAND[canonicalMun];

  if (!barangay) {
    return { isValid: true, canonicalIsland: island, canonicalMunicipality: canonicalMun, canonicalBarangay: null };
  }

  const canonicalBgy = getCanonicalBarangay(canonicalMun, barangay);
  if (canonicalBgy) {
    return { isValid: true, canonicalIsland: island, canonicalMunicipality: canonicalMun, canonicalBarangay: canonicalBgy };
  }

  return { isValid: false, canonicalIsland: null, canonicalMunicipality: null, canonicalBarangay: null };
}

export function calculateGeographicScore(
  mun1: string | null | undefined,
  bgy1: string | null | undefined,
  mun2: string | null | undefined,
  bgy2: string | null | undefined
): number {
  const loc1 = validateLocation(mun1, bgy1);
  const loc2 = validateLocation(mun2, bgy2);

  if (!loc1.isValid || !loc2.isValid) {
    return 0.0;
  }

  if (loc1.canonicalMunicipality === loc2.canonicalMunicipality) {
    if (loc1.canonicalBarangay && loc2.canonicalBarangay && loc1.canonicalBarangay === loc2.canonicalBarangay) {
      return 30.0;
    }
    return 25.0;
  }

  if (loc1.canonicalIsland === loc2.canonicalIsland) {
    return 15.0;
  }

  // Both valid in Batanes, but different islands
  return 5.0;
}
