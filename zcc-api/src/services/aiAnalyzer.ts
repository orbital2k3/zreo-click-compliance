import { z } from 'zod';

/**
 * Zod schema for AI response validation
 */
const AIResponseSchema = z.object({
  vendor_name: z.string(),
  report_type: z.string(),
  trust_criteria: z.array(z.string()),
  audit_period_start: z.string(), // ISO date
  audit_period_end: z.string(), // ISO date
  auditor_firm: z.string(),
  opinion: z.enum(['UNQUALIFIED', 'QUALIFIED', 'ADVERSE', 'DISCLAIMER']),
  opinion_summary: z.string(),
  subservice_method: z.enum(['CARVE_OUT', 'INCLUSIVE', 'NONE']),
  subservice_organizations: z.array(
    z.object({
      name: z.string(),
      services: z.string(),
    })
  ),
  exceptions: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      vendor_response: z.string(),
      ai_risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    })
  ),
  cuecs: z.array(
    z.object({
      id: z.string(),
      requirement: z.string(),
    })
  ),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * AI Analyzer Service
 * Sends PDF text to AI model endpoint and returns validated JSON
 */
export class AIAnalyzer {
  private apiKey: string;
  private endpoint: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || process.env.AI_MODEL_ENDPOINT || '';
    this.apiKey = apiKey || process.env.AI_MODEL_API_KEY || '';

    if (!this.endpoint) {
      console.warn('[AIAnalyzer] AI_MODEL_ENDPOINT not configured');
    }
    if (!this.apiKey) {
      console.warn('[AIAnalyzer] AI_MODEL_API_KEY not configured');
    }
  }

  /**
   * Analyze PDF text using AI model
   * @param pdfText - Extracted text from PDF
   * @returns Validated AI response
   */
  async analyzePDF(pdfText: string): Promise<AIResponse> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('AI_MODEL_ENDPOINT or AI_MODEL_API_KEY not configured');
    }

    const prompt = `You are a SOC 2 Type 2 audit expert. Analyze the attached document and return a JSON object with this exact structure:
{
  "vendor_name": string,
  "report_type": string,
  "trust_criteria": string[],
  "audit_period_start": string (ISO date),
  "audit_period_end": string (ISO date),
  "auditor_firm": string,
  "opinion": "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER",
  "opinion_summary": string (2-3 sentences),
  "subservice_method": "CARVE_OUT" | "INCLUSIVE" | "NONE",
  "subservice_organizations": [{ name: string, services: string }],
  "exceptions": [{
    "category": string,
    "description": string,
    "vendor_response": string,
    "ai_risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  }],
  "cuecs": [{ "id": string, "requirement": string }]
}
Return only valid JSON. No markdown, no explanation.

Document to analyze:
${pdfText}`;

    try {
      console.log('[AIAnalyzer] Sending request to AI endpoint:', this.endpoint);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          model: 'default', // Customize as needed
        }),
      });

      if (!response.ok) {
        throw new Error(
          `AI API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract JSON from response (handle wrapped responses)
      let jsonContent = data.content || data.result || data.text || JSON.stringify(data);

      // If the response is a string, try to extract JSON from it
      if (typeof jsonContent === 'string') {
        try {
          jsonContent = JSON.parse(jsonContent);
        } catch {
          // Try to find JSON in the string
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract JSON from AI response');
          }
        }
      }

      // Validate response against schema
      const validatedResponse = AIResponseSchema.parse(jsonContent);

      console.log('[AIAnalyzer] Response validated successfully');
      return validatedResponse;
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error('[AIAnalyzer] Response validation failed:', err.issues);
        throw new Error(`Invalid AI response format: ${err.issues.map(e => e.message).join(', ')}`);
      }
      console.error('[AIAnalyzer] API call failed:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const aiAnalyzer = new AIAnalyzer();
