'use server';
/**
 * @fileOverview A Site Reliability Engineering (SRE) agent for diagnosing system errors.
 *
 * - diagnoseError - Analyzes a system log and provides a diagnosis and recommended action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// The input is a SystemLog object, which can be passed as a stringified JSON.
const ErrorMonitorInputSchema = z.string().describe("A JSON string representing a single document from the 'system_logs' collection. The log contains error details, context, and occurrence count.");

const ErrorMonitorOutputSchema = z.object({
  diagnosis: z.enum([
      "Network/Connectivity Issue",
      "Firestore Security Rule Denial",
      "Client-Side Hydration Mismatch",
      "AI Assistant Logic Fault",
      "Unknown Application Error"
    ]).describe("The most likely root cause category for the error."),
  developerNotification: z.string().describe("A concise, technical summary of the problem for the developer, including the error pattern if detected."),
  suggestedAction: z.enum(["none", "force_reset_client_cache", "review_security_rules", "review_component_logic"])
    .describe("A machine-readable suggested next action for the system or developer."),
  isPatternDetected: z.boolean().describe("Set to true if the error log indicates multiple occurrences, suggesting a recurring pattern."),
});

export type ErrorMonitorInput = z.infer<typeof ErrorMonitorInputSchema>;
export type ErrorMonitorOutput = z.infer<typeof ErrorMonitorOutputSchema>;

/**
 * Public function to trigger the error diagnosis flow.
 * @param input The stringified SystemLog data.
 * @returns A promise that resolves to the diagnosis.
 */
export async function diagnoseError(input: ErrorMonitorInput): Promise<ErrorMonitorOutput> {
  return errorMonitorFlow({ log: input });
}

const errorMonitorPrompt = ai.definePrompt({
  name: 'errorMonitorPrompt',
  input: { schema: z.object({ log: ErrorMonitorInputSchema }) },
  output: { schema: ErrorMonitorOutputSchema },
  prompt: `
    You are a Staff Site Reliability Engineer (SRE) AI for a complex web application. Your task is to analyze an error log and provide a root cause analysis and a concise developer notification.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Do NOT include any text, commentary, or explanations outside of the JSON structure.
    3.  Analyze the entire log object, including 'errorDetail', 'contextSnapshot', 'occurrences', and 'resolution'.
    4.  Follow the diagnostic logic precisely.

    DIAGNOSTIC LOGIC:
    -   **Diagnose the Root Cause:**
        *   If 'errorDetail.message' contains "Missing or insufficient permissions", it is 'Firestore Security Rule Denial'.
        *   If 'errorDetail.message' or 'errorDetail.stack' mentions Next.js hydration errors ('Text content does not match server-rendered HTML', 'Hydration failed'), it's a 'Client-Side Hydration Mismatch'.
        *   If 'errorDetail.message' contains AI-related failures (e.g., 'The AI assistant did not return a valid action'), it's an 'AI Assistant Logic Fault'.
        *   If the error is generic (e.g., network timeout, failed to fetch), classify it as 'Network/Connectivity Issue'.
        *   If none of the above, classify as 'Unknown Application Error'.

    -   **Formulate Developer Notification:** Create a brief, technical notification based on the diagnosis.
        *   For a security rule error: "Firestore '{{contextSnapshot.requestOperation}}' op on '{{contextSnapshot.requestPath}}' was denied. Occurred {{occurrences}} times. Review collection group rules."
        *   For hydration: "Hydration mismatch in '{{contextSnapshot.userAgent}}'. Likely caused by date/time objects. 'rescueTriggered' was '{{resolution.rescueTriggered}}'. Occurred {{occurrences}} times."
        *   For AI fault: "AI assistant logic fault with message: '{{errorDetail.message}}'. Occurred {{occurrences}} times. Review the relevant flow's prompt or logic."

    -   **Determine Suggested Action:**
        *   For 'Client-Side Hydration Mismatch' or suspected local data corruption, suggest 'force_reset_client_cache'.
        *   For 'Firestore Security Rule Denial', suggest 'review_security_rules'.
        *   For 'AI Assistant Logic Fault', suggest 'review_component_logic'.
        *   For all others, suggest 'none'.
    
    -   **Pattern Detection:** If the 'occurrences' field in the log is greater than 1, set 'isPatternDetected' to true. Otherwise, set it to false.

    Here is the error log to analyze:
    {{{log}}}
  `,
});

const errorMonitorFlow = ai.defineFlow(
  {
    name: 'errorMonitorFlow',
    inputSchema: z.object({ log: ErrorMonitorInputSchema }),
    outputSchema: ErrorMonitorOutputSchema,
  },
  async ({ log }) => {
    const { output } = await errorMonitorPrompt({ log });
    if (!output) {
      throw new Error("The SRE agent did not return a valid diagnosis.");
    }
    return output;
  }
);
