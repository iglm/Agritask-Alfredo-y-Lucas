'use server';
/**
 * @fileOverview An agricultural data auditing AI agent.
 *
 * - auditData - A function that handles the data auditing process.
 * - DataAuditInput - The input type for the auditData function.
 * - DataAuditOutput - The return type for the auditData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the structure for a single detected audit observation
const AuditObservationSchema = z.object({
  description: z.string().describe("A clear, concise description of the logical inconsistency or observation found in the data."),
  category: z.string().describe("A category for the observation, e.g., 'Planificación a Largo Plazo', 'Gestión de Colaboradores', 'Coherencia de Datos', 'Salud y Seguridad'."),
  suggestion: z.string().describe("A brief, actionable suggestion to resolve the observation."),
  severity: z.enum(["Alta", "Media", "Baja"]).describe("The severity level of the audit observation."),
});

// Define the input schema for the flow
const DataAuditInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'lots', 'tasks', and 'staff' from the farm management system."),
  currentDate: z.string().describe("Today's date in yyyy-MM-dd format for temporal analysis."),
});
export type DataAuditInput = z.infer<typeof DataAuditInputSchema>;

// Define the output schema for the flow
const DataAuditOutputSchema = z.object({
    observations: z.array(AuditObservationSchema).describe("A list of audit observations. If no issues are found, this will be an empty array.")
});
export type DataAuditOutput = z.infer<typeof DataAuditOutputSchema>;


/**
 * Public function to trigger the data audit flow.
 * @param input The farm data to be audited.
 * @returns A promise that resolves to the list of audit observations.
 */
export async function auditData(input: DataAuditInput): Promise<DataAuditOutput> {
  return dataAuditFlow(input);
}

// Define the AI prompt for data auditing
const dataAuditPrompt = ai.definePrompt({
  name: 'dataAuditPrompt',
  input: {schema: DataAuditInputSchema},
  output: {schema: DataAuditOutputSchema},
  prompt: `
    You are an expert farm manager and data auditor AI with 20 years of experience, focusing on Colombian labor laws and occupational safety. The current date is {{currentDate}}.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Do NOT include any text, commentary, or explanations outside of the JSON structure.
    3.  Analyze the provided JSON data to find logical inconsistencies, omissions, and opportunities for improvement.
    4.  If you find no issues, you MUST return an object with an empty "observations" array.
    5.  For each observation, provide a clear description, category, a concrete suggestion, and a severity level.

    ANALYTICAL FOCUS:
    -   **Health & Safety Audit (EPS - HIGH SEVERITY):** This is your highest priority. Review the 'staff' list. If a collaborator with 'employmentType' of 'Contratista' or 'Temporal' is assigned to a 'Mantenimiento' task (which may involve chemicals or machinery) and their 'eps' field is empty, generate a 'High' severity observation. The suggestion must be 'Registrar la información de EPS del colaborador de inmediato'.
    -   **Harvest Omissions:** Identify lots with a 'sowingDate' from several years ago that have no 'Cosecha' (Harvest) tasks registered in the last year. Perennial crops like coffee or avocado should have annual harvests.
    -   **Inactive Collaborators:** Find 'staff' members who have not been assigned to any 'tasks' in the last 60-90 days. They might be inactive and require a status update.
    -   **Incomplete Planning:** Detect recently planted lots (within the last 6 months) that have no 'Mantenimiento' or 'Fertilización' tasks scheduled for the future. This indicates a lack of planning.
    -   **Lot Utilization:** Identify lots that have existed for a long time but have no tasks assigned, either past or future. They could be abandoned or underutilized.

    Data to analyze:
    {{{jsonData}}}
  `,
});


// Define the Genkit flow
const dataAuditFlow = ai.defineFlow(
  {
    name: 'dataAuditFlow',
    inputSchema: DataAuditInputSchema,
    outputSchema: DataAuditOutputSchema,
  },
  async (input) => {
    const {output} = await dataAuditPrompt(input);
    return output!;
  }
);
