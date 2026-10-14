import {
  ALL_MUNICIPALITIES,
  CANONICAL_GEOGRAPHY,
  calculateGeographicScore,
  LocationValidationResult,
  resolveIsland,
  validateLocation,
} from '../core/geography';

export class GeographyService {
  static getHierarchy(): Record<string, Record<string, string[]>> {
    return CANONICAL_GEOGRAPHY;
  }

  static getMunicipalities(): string[] {
    return ALL_MUNICIPALITIES;
  }

  static resolveIsland(municipality: string | null | undefined): string | null {
    return resolveIsland(municipality);
  }

  static validateLocation(
    municipality: string | null | undefined,
    barangay: string | null | undefined = null
  ): LocationValidationResult {
    return validateLocation(municipality, barangay);
  }

  static scoreDistance(
    mun1: string | null | undefined,
    bgy1: string | null | undefined,
    mun2: string | null | undefined,
    bgy2: string | null | undefined
  ): number {
    return calculateGeographicScore(mun1, bgy1, mun2, bgy2);
  }
}
