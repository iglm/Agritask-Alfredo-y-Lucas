'use server';
/**
 * @fileOverview An AI assistant that converts natural language into executable actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schemas for the actions the assistant can perform.
const AddProductiveUnitPayloadSchema = z.object({
  farmName: z.string().describe("The name of the farm or productive unit."),
});

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

const UpdateTaskStatusPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to update."),
  status: z.enum(['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado']).describe("The new status for the task."),
  progress: z.number().optional().describe("The new progress percentage (0-100). Should be 100 if status is 'Finalizado'."),
});

const UpdateStaffRatePayloadSchema = z.object({
    staffId: z.string().describe("The ID of the staff member to update."),
    newRate: z.number().positive().describe("The new daily rate for the staff member."),
});


const ErrorPayloadSchema = z.object({
    message: z.string().describe("A description of why the command could not be processed."),
});


// Union of all possible actions
const AssistantActionSchema = z.union([
  z.object({ action: z.enum(['addProductiveUnit']), payload: AddProductiveUnitPayloadSchema }),
  z.object({ action: z.enum(['addLot']), payload: AddLotPayloadSchema }),
  z.object({ action: z.enum(['addTask']), payload: AddTaskPayloadSchema }),
  z.object({ action: z.enum(['addStaff']), payload: AddStaffPayloadSchema }),
  z.object({ action: z.enum(['updateTaskStatus']), payload: UpdateTaskStatusPayloadSchema }),
  z.object({ action: z.enum(['updateStaffRate']), payload: UpdateStaffRatePayloadSchema }),
  z.object({ action: z.enum(['error']), payload: ErrorPayloadSchema }),
]);

// Define the input schema for the flow
const AssistantInputSchema = z.object({
  command: z.string().describe("The user's natural language command."),
  contextData: z.string().describe("A JSON string containing arrays of 'lots', 'staff', 'productiveUnits', and 'tasks' from the farm management system. Each object only contains the 'id', 'name' (or 'type' for tasks), and any other relevant fields like 'status' for tasks or 'baseDailyRate' for staff."),
  currentDate: z.string().describe("Today's date in yyyy-MM-dd format."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the flow
const AssistantOutputSchema = z.object({
    action: AssistantActionSchema,
    explanation: z.string().describe("A single, brief, past-tense confirmation sentence for the UI to display AFTER the action is successful, e.g., 'OK. He programado la labor de Fertilización.' or 'Listo. He actualizado la labor.'"),
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
    You are an intelligent command-parsing AI for a farm management app. Your only job is to translate a user's natural language command into a structured JSON action. You must be efficient and precise. You are forbidden from having conversations.

    **CRITICAL INSTRUCTIONS:**
    1.  **ANALYZE** the user's command to understand their intent. This can be creating new items or updating existing ones.
    2.  **USE** the provided \`contextData\` JSON to find the exact \`id\` for any existing entities mentioned (e.g., lots, staff, productive units, tasks).
    3.  **CONSTRUCT** one of the allowed JSON actions: \`addProductiveUnit\`, \`addLot\`, \`addTask\`, \`addStaff\`, \`updateTaskStatus\`, \`updateStaffRate\`.
    4.  **FOR UPDATES:**
        *   When a user asks to change a task's status (e.g., "mark as done", "finish this task"), use the \`updateTaskStatus\` action. If the new status is 'Finalizado', you MUST set the progress to 100.
        *   When a user asks to change a staff member's pay (e.g., "update Juan's rate to 60000"), use the \`updateStaffRate\` action.
    5.  **IF** the command is ambiguous, missing critical information (like a task name or a new rate), or refers to an entity not in the context, you MUST use the \`error\` action with a clear, helpful message in Spanish.
    6.  **THE \`explanation\` FIELD** must be a single, brief, confirmation sentence in Spanish (past tense), e.g., "OK. He programado la labor de Fertilización." or "Listo. He actualizado la tarifa de Juan.".
    7.  **NEVER** generate conversational text. Your output must ONLY be the final JSON object.
    8.  Use \`{{currentDate}}\` to resolve relative dates like "mañana" or "el próximo lunes" when creating new items.

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
