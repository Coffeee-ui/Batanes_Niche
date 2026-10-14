import { COMMON_SKILLS } from '../core/constants';

export const OTHER_SKILL = 'Other';

export function normalizeSkill(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function splitSkills(rawSkills: string | null | undefined): string[] {
  if (!rawSkills) return [];
  return rawSkills
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

export function canonicalSkill(value: string, catalog: string[] = COMMON_SKILLS): string | null {
  const normalized = normalizeSkill(value);
  return catalog.find(skill => normalizeSkill(skill) === normalized) || null;
}

export function normalizeSkillValues(values: string[], catalog: string[] = COMMON_SKILLS): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned || normalizeSkill(cleaned) === normalizeSkill(OTHER_SKILL)) {
      continue;
    }
    const resolved = canonicalSkill(cleaned, catalog) || cleaned.replace(/\s+/g, ' ');
    const comparisonValue = normalizeSkill(resolved);
    if (!seen.has(comparisonValue)) {
      seen.add(comparisonValue);
      result.push(resolved);
    }
  }
  return result;
}

export function serializeSkillValues(values: string[]): string | null {
  const normalized = normalizeSkillValues(values);
  return normalized.join(', ') || null;
}

export function skillsMatch(needed: string[], candidate: string[]): Set<string> {
  const candidateById = new Set<string>(
    candidate
      .map(normalizeSkill)
      .filter(val => val !== normalizeSkill(OTHER_SKILL))
  );

  const matched = new Set<string>();
  for (const value of needed) {
    const normalized = normalizeSkill(value);
    if (normalized !== normalizeSkill(OTHER_SKILL) && candidateById.has(normalized)) {
      matched.add(normalized);
    }
  }
  return matched;
}
