const pdf = require('pdf-parse');

export interface ParseResult {
  opinion: 'UNQUALIFIED' | 'QUALIFIED' | 'ADVERSE' | 'UNKNOWN';
  exceptions: Array<{ id: string, detail: string }>;
  rawText: string;
}

/**
 * Extract text from PDF and use LLM to classify SOC 2 findings
 */
export async function parseSOC2Report(buffer: Buffer): Promise<ParseResult> {
  // 1. Extract Text
  const data = await pdf(buffer);
  const text = data.text;

  console.log(`[LLM] Extracted ${text.length} characters. Processing with Gemini...`);

  // 2. Mock Agent Call (To be replaced with real Gemini API)
  // TODO: Call Google Gemini with the system prompt to extract findings
  
  return {
    opinion: 'UNQUALIFIED',
    exceptions: [],
    rawText: text.substring(0, 1000) // Keep it small for logs
  };
}
