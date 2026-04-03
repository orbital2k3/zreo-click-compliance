import { ParseResult } from './llmParser';

export interface ScoreResult {
  score: number;
  verdict: 'APPROVED' | 'FLAGGED';
}

/**
 * Apply a rule-set to the parsed SOC 2 findings to calculate 
 * the numeric trust score and final automated verdict.
 */
export function calculateRiskScore(parsed: ParseResult): ScoreResult {
  let score = 100;

  // Rule 1: Auditor's Opinion
  if (parsed.opinion === 'QUALIFIED') {
    score -= 30;
  } else if (parsed.opinion === 'ADVERSE') {
    score -= 60;
  }

  // Rule 2: Exception Count
  const exceptionPenalty = parsed.exceptions.length * 10;
  score = Math.max(0, score - exceptionPenalty);

  // Verdict Logic
  const verdict = score >= 75 && parsed.opinion === 'UNQUALIFIED' 
    ? 'APPROVED' 
    : 'FLAGGED';

  return { score, verdict };
}
