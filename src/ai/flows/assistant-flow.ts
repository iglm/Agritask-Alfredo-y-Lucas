'use server';
/**
 * @fileOverview An AI assistant that converts natural language into executable actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Lot, Staff, Task } from '@/lib/types';

// Schemas for the actions the assistant can perform.
// These should correspond to the data needed to *create* an entity.
const AddLotPayloadSchema = z.object({
  productiveUnitId: z.string().describe("The ID of the productive unit this lot belongs to."),
  name: z.string().describe("Name of the lot."),
  areaHectares: z.number().describe("Area of the lot in hectares."),
  location: z.string().optional().describe("Location of the lot (Vereda/Sector)."),
  technicalNotes: z.string().optional().describe("Technical notes about the lot."),
  sowingDate: z.string().optional().describe("The sowing date in 'yyyy-MM-dd' format."),
});

const AddTaskPayloadSchema = z.object({
    lotId: z.string().describe("The ID of the lot where the task takes place."),
    category: z.enum(["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"]).describe("Category of the task."),
    type: z.string().describe("Specific type of task (e.g., 'Fumigación', 'Fertilización')."),
    responsibleId: z.string().describe("The ID of the staff member responsible for the task."),
    startDate: z.string().describe("The start date of the task in 'yyyy-MM-dd' format."),
    status: z.enum(['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado']).default('Por realizar'),
    progress: z.number().default(0),
    plannedJournals: z.number().default(0).describe("Planned man-days for the task."),
    plannedCost: z.number().default(0),
    supplyCost: z.number().default(0),
    actualCost: z.number().default(0),
});

const AddStaffPayloadSchema = z.object({
    name: z.string().describe("Name of the staff member."),
    contact: z.string().describe("Contact information for the staff member."),
    employmentType: z.enum(["Permanente", "Temporal", "Contratista"]).describe("Type of employment."),
    baseDailyRate: z.number().describe("Base daily rate for the staff member."),
});

const ErrorPayloadSchema = z.object({
    message: z.string().describe("A description of why the command could not be processed."),
});


// Union of all possible actions
const AssistantActionSchema = z.union([
  z.object({ action: z.literal('addLot'), payload: AddLotPayloadSchema }),
  z.object({ action: z.literal('addTask'), payload: AddTaskPayloadSchema }),
  z.object({ action: z.literal('addStaff'), payload: AddStaffPayloadSchema }),
  z.object({ action: z.literal('error'), payload: ErrorPayloadSchema }),
]);

// Define the input schema for the flow
const AssistantInputSchema = z.object({
  command: z.string().describe("The user's natural language command."),
  contextData: z.string().describe("A JSON string containing arrays of 'lots', 'staff', 'productiveUnits', etc., from the farm management system. Also contains 'currentDate' in yyyy-MM-dd format."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the flow
const AssistantOutputSchema = z.object({
    action: AssistantActionSchema,
    explanation: z.string().describe("A brief, past-tense confirmation message for the UI to display AFTER the action is successful, e.g., 'OK. He programado la labor de Fertilización.' or 'Listo, he creado el lote La Pradera.'"),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


/**
 * Public function to trigger the assistant flow.
 * @param input The user command and context data.
 * @returns A promise that resolves to the structured action.
 */
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}

// Define the AI prompt for the assistant
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `
    You are a highly efficient, task-oriented assistant for a farm management application. Your ONLY job is to convert a user's natural language command into a structured JSON object representing a single, executable action.
    You MUST use the provided JSON context data to find the necessary IDs for lots, staff, productiveUnits, etc., based on the names the user provides.

    **RULES:**
    1.  **NEVER engage in conversation.** Do not ask for clarification, apologize, or offer suggestions.
    2.  **ONLY respond with the structured JSON output.** Do not add any extra text or explanations before or after the JSON.
    3.  If a command is ambiguous, lacks information, or refers to items not found in the context data, you MUST return a specific error action: \`{ "action": "error", "payload": { "message": "Your error description here" } }\`. Be specific in the error message. For example, if a lot name is not found, say "No se pudo encontrar un lote llamado 'nombre_del_lote'".
    4.  The 'explanation' field in the output should be a very brief, past-tense confirmation message for the UI to display AFTER the action is successful. E.g., "OK. He programado la labor de Fertilización." or "Listo. He creado el lote La Pradera."
    5.  When interpreting dates like "mañana", "viernes", or relative dates, use the 'currentDate' from the context data as the reference point. Today is {{JSON.parse(contextData).currentDate}}.

    **User Command:** \`{{{command}}}\`

    **JSON Context Data:** \`{{{contextData}}}\`
  `,
});


// Define the Genkit flow
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    if (!output) {
      throw new Error("The AI assistant did not return a valid action.");
    }
    return output;
  }
);
