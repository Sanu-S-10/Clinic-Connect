/**
 * Specialty mapping to normalize variations and misspellings
 * Maps various spellings/variations to their canonical form
 */
export const specialtyMapping: Record<string, string> = {
  // Orthopaedics - catch all variations
  'orthopaedic': 'Orthopaedics',
  'orthopaedics': 'Orthopaedics',
  'orthopedic': 'Orthopaedics',
  'orthopedics': 'Orthopaedics',
  'orthopaedician': 'Orthopaedics',
  'orthopedician': 'Orthopaedics',
  'orthopaedicist': 'Orthopaedics',
  'orthopedicist': 'Orthopaedics',
  'orthopaedic surgeon': 'Orthopaedics',
  'orthopedic surgeon': 'Orthopaedics',
  'consultant orthopaedic surgeon': 'Orthopaedics',
  'consultant orthopedic surgeon': 'Orthopaedics',
  'orthopaedics, arthroscopic surgeon': 'Orthopaedics',
  'orthopedics, arthroscopic surgeon': 'Orthopaedics',
  'arthroscopic surgeon': 'Orthopaedics',

  // General Medicine variants - consolidate all
  'general medicine': 'General Medicine',
  'general physician': 'General Medicine',
  'general practitioner': 'General Medicine',
  'general practitoner': 'General Medicine',
  'gp': 'General Medicine',
  'physician': 'General Medicine',

  // Gynaecology - all variations
  'gynaecology': 'Gynaecology',
  'gynecology': 'Gynaecology',
  'gynaecologist': 'Gynaecology',
  'gynecologist': 'Gynaecology',
  'obs & gynaecology': 'Obstetrics & Gynaecology',
  'obs and gynaecology': 'Obstetrics & Gynaecology',
  'obstetrics & gynaecology (obg)': 'Obstetrics & Gynaecology',
  'obstetrics and gynaecology (obg)': 'Obstetrics & Gynaecology',
  'obg': 'Obstetrics & Gynaecology',
  'ob/gyn': 'Obstetrics & Gynaecology',

  // Dermatology - all variations
  'dermatology': 'Dermatology',
  'dermatologist': 'Dermatology',
  'dermatologic': 'Dermatology',

  // ENT - all variations
  'ent': 'ENT',
  'ent specialist': 'ENT',
  'ear nose throat': 'ENT',
  'otolaryngology': 'ENT',
  'otolaryngologist': 'ENT',

  // Cardiology - all variations
  'cardiology': 'Cardiology',
  'cardiologist': 'Cardiology',
  'cardiac': 'Cardiology',
  'cardiac surgery': 'Cardiology',

  // Pediatrics - all variations
  'paediatrics': 'Paediatrics',
  'pediatrics': 'Paediatrics',
  'paediatrician': 'Paediatrics',
  'pediatrician': 'Paediatrics',

  // General Surgery - all variations
  'general surgery': 'General Surgery',
  'general surgeon': 'General Surgery',
  'surgery': 'General Surgery',
  'surgical': 'General Surgery',

  // Internal Medicine - all variations
  'internal medicine': 'Internal Medicine',
  'internist': 'Internal Medicine',

  // Nephrology - all variations
  'nephrology': 'Nephrology',
  'nephrologist': 'Nephrology',

  // Oncology - all variations
  'oncology': 'Oncology',
  'oncologist': 'Oncology',
  'medical oncology': 'Oncology',

  // Ophthalmology - all variations
  'ophthalmology': 'Ophthalmology',
  'ophthalmologist': 'Ophthalmology',
  'eye specialist': 'Ophthalmology',
  'optometry': 'Ophthalmology',

  // Psychiatry - all variations
  'psychiatry': 'Psychiatry',
  'psychiatrist': 'Psychiatry',
  'mental health': 'Psychiatry',

  // Neurology - all variations
  'neurology': 'Neurology',
  'neurologist': 'Neurology',
  'neuro': 'Neurology',
};

/**
 * Normalize a specialty name by mapping variations to their canonical form
 * @param specialty - The specialty name to normalize
 * @returns The canonical form of the specialty
 */
export function normalizeSpecialty(specialty: string): string {
  if (!specialty) return '';
  const normalized = specialty.trim().toLowerCase();
  return specialtyMapping[normalized] || specialty.trim();
}

/**
 * Get all unique canonical specialties from a list
 * @param specialties - Array of specialty names
 * @returns Sorted array of unique canonical specialties
 */
export function getUniqueCanonicalSpecialties(specialties: string[]): string[] {
  const normalized = new Set<string>();
  specialties.forEach(spec => {
    const canonical = normalizeSpecialty(spec);
    if (canonical) {
      normalized.add(canonical);
    }
  });
  return Array.from(normalized).sort();
}
