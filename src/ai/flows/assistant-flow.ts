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
    newRate: z.number().describe("The new, positive daily rate for the staff member. It must be greater than zero."),
});

const AnswerPayloadSchema = z.object({
  text: z.string().describe("The direct, concise answer to the user's question."),
});

const ErrorPayloadSchema = z.object({
    message: z.string().describe("A clear and direct question in Spanish asking the user for the information that is missing to complete the command."),
});


// Union of all possible actions
const AssistantActionSchema = z.union([
  z.object({ action: z.enum(['addProductiveUnit']), payload: AddProductiveUnitPayloadSchema }),
  z.object({ action: z.enum(['addLot']), payload: AddLotPayloadSchema }),
  z.object({ action: z.enum(['addTask']), payload: AddTaskPayloadSchema }),
  z.object({ action: z.enum(['addStaff']), payload: AddStaffPayloadSchema }),
  z.object({ action: z.enum(['updateTaskStatus']), payload: UpdateTaskStatusPayloadSchema }),
  z.object({ action: z.enum(['updateStaffRate']), payload: UpdateStaffRatePayloadSchema }),
  z.object({ action: z.enum(['answer']), payload: AnswerPayloadSchema }),
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
    explanation: z.string().describe("A single, brief confirmation sentence for the UI, e.g., 'OK. He programado la labor.', 'Aquí tienes la información que pediste.', or 'Disculpa, necesito un dato más.'"),
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
    You are an intelligent assistant AI for a farm management app. Your primary jobs are: 1. Translate user commands into structured JSON actions. 2. Answer questions based on the provided context data. You must be efficient and precise. You are forbidden from having long conversations. Your output MUST ONLY be the final JSON object.

    **CRITICAL INSTRUCTIONS:**
    1.  **ANALYZE** the user's input to understand their intent. This can be creating new items, updating existing ones, or asking a question.
    2.  **USE** the provided \`contextData\` JSON to find the exact \`id\` for any existing entities mentioned (e.g., lots, staff, productive units, tasks).
    3.  **EXECUTING COMMANDS:**
        *   For creating or updating, construct one of the allowed JSON actions: \`addProductiveUnit\`, \`addLot\`, \`addTask\`, \`addStaff\`, \`updateTaskStatus\`, \`updateStaffRate\`.
        *   When a user asks to change a task's status (e.g., "mark as done"), use the \`updateTaskStatus\` action. If the new status is 'Finalizado', you MUST set the progress to 100.
        *   Use \`{{currentDate}}\` to resolve relative dates like "mañana" or "el próximo lunes".
    4.  **ANSWERING QUESTIONS:**
        *   If the user asks a question (e.g., "cuántos lotes tengo?", "cuál es la tarifa de Juan?"), you MUST use the \`answer\` action.
        *   Formulate a direct, concise answer based *only* on the provided \`contextData\` and place it in the \`payload.text\`.
    5.  **HANDLING AMBIGUITY (VERY IMPORTANT):**
        *   If a command is ambiguous or missing critical information (e.g., "crea una labor" without a name or lot), you MUST use the \`error\` action.
        *   The \`payload.message\` for the \`error\` action MUST be a **clear and direct question in Spanish** asking the user for the missing piece of information (e.g., "¿Para qué lote es la labor?" or "¿Cuál es el nuevo estado de la labor?"). Do NOT just state that information is missing.
    6.  **THE \`explanation\` FIELD:**
        *   For successful **actions** (create/update), this must be a single, brief, confirmation sentence in Spanish (past tense), e.g., "OK. He programado la labor."
        *   For **answers**, this should be a simple transition like "Aquí tienes la información que pediste."
        *   For **errors**, this should be an apologetic phrase like "Disculpa, necesito un dato más."

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
