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
  contextData: z.string().describe("A JSON string containing arrays of 'lots', 'staff', and 'productiveUnits' from the farm management system. Each object only contains the 'id' and 'name' of the entity. Also contains 'currentDate' in yyyy-MM-dd format."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the flow
const AssistantOutputSchema = z.object({
    action: AssistantActionSchema,
    explanation: z.string().describe("A single, brief, past-tense confirmation sentence for the UI to display AFTER the action is successful, e.g., 'OK. He programado la labor de Fertilización.' or 'Listo, he creado el lote La Pradera.'"),
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
    You are a command-parsing AI for a farm management app. Your SOLE function is to translate a user's command into a single, structured JSON action. You are forbidden from answering questions, holding conversations, or generating any text that is not part of the specified JSON output format.

    **STRICT INSTRUCTIONS:**
    1.  **ANALYZE** the user's command.
    2.  **USE** the provided \`contextData\` JSON to find the exact \`id\` for any entities mentioned by name (e.g., lot names, staff names, productive unit names).
    3.  **CONSTRUCT** one of the allowed JSON actions (\`addLot\`, \`addTask\`, \`addStaff\`).
    4.  **IF** the command is unclear, missing information (e.g., creating a task without specifying a lot), or refers to an entity not found in the context, you MUST respond with the \`error\` action. The error message must be specific and in Spanish.
    5.  **THE \`explanation\` FIELD** must be a single, short, past-tense sentence in Spanish confirming the action, like "Listo, he creado el lote La Pradera."
    6.  **NEVER** generate conversational text. Your entire output must be only the JSON object.
    7.  Use the \`currentDate\` from the context to resolve relative dates like "mañana" or "el viernes". Today's date is: {{JSON.parse(contextData).currentDate}}.

    **User Command:** \`{{{command}}}\`

    **JSON Context Data (available entities and IDs):** \`{{{contextData}}}\`
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
