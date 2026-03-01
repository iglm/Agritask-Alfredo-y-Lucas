'use server';
/**
 * @fileOverview An agricultural anomaly detection AI agent.
 *
 * - detectAnomalies - A function that handles the anomaly detection process.
 * - AnomalyDetectionInput - The input type for the detectAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the structure for a single detected anomaly
const AnomalySchema = z.object({
  description: z.string().describe("A clear, concise description of the anomaly or potential issue found in the data."),
  severity: z.enum(["Alto", "Medio", "Bajo"]).describe("The severity level of the detected anomaly."),
  category: z.string().describe("A category for the anomaly, e.g., 'Costos', 'Planificación', 'Rendimiento'."),
});

// Define the input schema for the flow
const AnomalyDetectionInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'lots', 'tasks', and 'transactions' from the farm management system."),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

// Define the output schema for the flow
const AnomalyDetectionOutputSchema = z.object({
    anomalies: z.array(AnomalySchema).describe("A list of detected anomalies. If no anomalies are found, this will be an empty array.")
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;


/**
 * Public function to trigger the anomaly detection flow.
 * @param input The farm data to be analyzed.
 * @returns A promise that resolves to the list of detected anomalies.
 */
export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

// Define the AI prompt for anomaly detection
const anomalyPrompt = ai.definePrompt({
  name: 'anomalyPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `
    You are an expert agricultural and financial data analyst AI. Your primary directive is to analyze JSON data from a farm management system and identify significant anomalies.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Do NOT include any text, commentary, or explanations outside of the JSON structure.
    3.  Analyze the provided data to detect only the most significant anomalies, inconsistencies, or risks.
    4.  If no significant anomalies are found, you MUST return an object with an empty "anomalies" array. Do not invent issues.
    5.  Be concise and direct in your descriptions.

    ANALYTICAL FOCUS:
    -   **Cost Overruns in Tasks:** Identify tasks where 'actualCost' significantly exceeds 'plannedCost'. Ignore minor deviations under 15%.
    -   **Unexpected Expenses:** Find 'Egreso' type transactions with unusually high amounts or in categories that typically do not have high expenses. Compare expenses with task costs to find discrepancies.
    -   **Critical Delays:** Pinpoint important tasks (where 'status' is not 'Finalizado') whose 'startDate' has already passed. Pay special attention to 'Cosecha' and 'Siembra' categories.
    -   **Problem Concentration:** Find lots that accumulate multiple troubled tasks (delayed, over-cost, etc.) or have a high concentration of expenses.
    -   **Data Coherence:** Detect obvious inconsistencies, such as an 'endDate' that is earlier than the 'startDate' in a task.

    Data to analyze:
    {{{jsonData}}}
  `,
});


// Define the Genkit flow
const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async (input) => {
    const {output} = await anomalyPrompt(input);
    return output!;
  }
);
