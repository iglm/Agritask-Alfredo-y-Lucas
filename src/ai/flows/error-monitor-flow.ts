'use server';
/**
 * @fileOverview A Site Reliability Engineering (SRE) agent for diagnosing system errors.
 *
 * - diagnoseError - Analyzes a system log and provides a diagnosis and recommended action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// The input is a SystemLog object, which can be passed as a stringified JSON.
const ErrorMonitorInputSchema = z.string().describe("A JSON string representing a single document from the 'system_logs' collection.");

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
  isPatternDetected: z.boolean().describe("Set to true if the error appears to be part of a recurring pattern (e.g., same error from same browser)."),
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
    You are a Staff Site Reliability Engineer (SRE) for a complex web application. Your task is to analyze an error log and provide a root cause analysis.

    Here is the error log to analyze:
    {{{log}}}

    INSTRUCTIONS:
    1.  **Diagnose the Root Cause:** Based on the 'errorMessage', 'errorStack', and 'userAgent', determine the most likely category of the problem.
        *   If the message contains "Missing or insufficient permissions", it is a 'Firestore Security Rule Denial'.
        *   If the stack trace mentions Next.js hydration errors ('Text content does not match server-rendered HTML', 'Hydration failed'), and especially if the user agent is a specific known browser, it's a 'Client-Side Hydration Mismatch'.
        *   If the error message indicates a failure in an AI flow (e.g., 'The AI assistant did not return a valid action sequence'), it's an 'AI Assistant Logic Fault'.
        *   If the error is generic (e.g., network timeout, failed to fetch), classify it as 'Network/Connectivity Issue'.
        *   If none of the above, classify as 'Unknown Application Error'.

    2.  **Formulate Developer Notification:** Create a brief, technical notification for the lead developer.
        *   Example for a security rule error: "Pattern Detected: Firestore 'list' operation on '/tasks' denied for multiple users. Review security rules for collection group queries."
        *   Example for hydration: "Hydration error detected in Chrome on component 'UpcomingTasks'. The 'Date' object is likely the cause. Recommend moving date-sensitive logic to useEffect."

    3.  **Determine Suggested Action:**
        *   For 'Client-Side Hydration Mismatch' or suspected local data corruption, suggest 'force_reset_client_cache'.
        *   For 'Firestore Security Rule Denial', suggest 'review_security_rules'.
        *   For 'AI Assistant Logic Fault', suggest 'review_component_logic'.
        *   For all others, suggest 'none'.
    
    4.  **Pattern Detection:** Based on the information, make an educated guess if this is part of a recurring pattern. For this simulation, if the error message is a 'Firestore Security Rule Denial' or 'Client-Side Hydration Mismatch', set 'isPatternDetected' to true. Otherwise, set it to false.
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
