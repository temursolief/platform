// IELTS Listening Band Score (out of 40 questions)
export const LISTENING_BAND_TABLE: Record<number, number> = {
  40: 9.0, 39: 9.0,
  38: 8.5, 37: 8.5,
  36: 8.0, 35: 8.0, 34: 8.0, 33: 8.0,
  32: 7.5, 31: 7.5, 30: 7.5,
  29: 7.0, 28: 7.0, 27: 7.0, 26: 7.0,
  25: 6.5, 24: 6.5, 23: 6.5,
  22: 6.0, 21: 6.0, 20: 6.0, 19: 6.0, 18: 6.0,
  17: 5.5, 16: 5.5, 15: 5.5, 14: 5.5,
  13: 5.0, 12: 5.0, 11: 5.0, 10: 5.0,
  9: 4.5, 8: 4.5, 7: 4.5,
  6: 4.0, 5: 4.0, 4: 4.0,
  3: 3.5, 2: 3.5,
  1: 3.0, 0: 0,
}

// IELTS Reading Band Score (out of 40 questions) - Academic
export const READING_ACADEMIC_BAND_TABLE: Record<number, number> = {
  40: 9.0, 39: 9.0,
  38: 8.5, 37: 8.5,
  36: 8.0, 35: 8.0, 34: 8.0, 33: 8.0,
  32: 7.5, 31: 7.5, 30: 7.5,
  29: 7.0, 28: 7.0, 27: 7.0,
  26: 6.5, 25: 6.5, 24: 6.5, 23: 6.5,
  22: 6.0, 21: 6.0, 20: 6.0, 19: 6.0, 18: 6.0,
  17: 5.5, 16: 5.5, 15: 5.5,
  14: 5.0, 13: 5.0, 12: 5.0, 11: 5.0,
  10: 4.5, 9: 4.5, 8: 4.5,
  7: 4.0, 6: 4.0, 5: 4.0,
  4: 3.5, 3: 3.5,
  2: 3.0, 1: 2.5, 0: 0,
}

// IELTS Reading Band Score (out of 40 questions) - General Training
export const READING_GENERAL_BAND_TABLE: Record<number, number> = {
  40: 9.0,
  39: 8.5,
  38: 8.0, 37: 8.0,
  36: 7.5, 35: 7.5, 34: 7.5,
  33: 7.0, 32: 7.0, 31: 7.0, 30: 7.0,
  29: 6.5, 28: 6.5, 27: 6.5,
  26: 6.0, 25: 6.0, 24: 6.0, 23: 6.0,
  22: 5.5, 21: 5.5, 20: 5.5, 19: 5.5, 18: 5.5,
  17: 5.0, 16: 5.0, 15: 5.0,
  14: 4.5, 13: 4.5, 12: 4.5,
  11: 4.0, 10: 4.0, 9: 4.0,
  8: 3.5, 7: 3.5, 6: 3.5,
  5: 3.0, 4: 3.0,
  3: 2.5, 2: 2.0, 1: 1.0, 0: 0,
}

export type ScoreTableType = 'listening' | 'reading_academic' | 'reading_general'

export function calculateBandScore(
  rawScore: number,
  testType: ScoreTableType
): number {
  const table =
    testType === 'listening'
      ? LISTENING_BAND_TABLE
      : testType === 'reading_academic'
      ? READING_ACADEMIC_BAND_TABLE
      : READING_GENERAL_BAND_TABLE

  return table[Math.min(rawScore, 40)] ?? 0
}

export function getBandDescriptor(bandScore: number): string {
  if (bandScore >= 9) return 'Expert'
  if (bandScore >= 8) return 'Very Good'
  if (bandScore >= 7) return 'Good'
  if (bandScore >= 6) return 'Competent'
  if (bandScore >= 5) return 'Modest'
  if (bandScore >= 4) return 'Limited'
  if (bandScore >= 3) return 'Extremely Limited'
  if (bandScore >= 2) return 'Intermittent'
  if (bandScore >= 1) return 'Non-user'
  return 'Did not attempt'
}

export function getBandColor(bandScore: number): string {
  if (bandScore >= 8) return 'text-emerald-600'
  if (bandScore >= 7) return 'text-green-600'
  if (bandScore >= 6) return 'text-blue-600'
  if (bandScore >= 5) return 'text-yellow-600'
  if (bandScore >= 4) return 'text-orange-600'
  return 'text-red-600'
}
