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
  crop: z.string().describe("The main crop for this lot (e.g., 'Aguacate', 'Café')."),
  areaHectares: z.number().describe("Area of the lot in hectares."),
  location: z.string().optional().describe("Location of the lot (Vereda/Sector)."),
  technicalNotes: z.string().optional().describe("Technical notes about the lot."),
  sowingDate: z.string().optional().describe("The sowing date in 'yyyy-MM-dd' format."),
});

const AddTaskPayloadSchema = z.object({
    lotId: z.string().describe("The ID of the lot where the task takes place."),
    category: z.enum(["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"]).describe("Category of the task."),
    type: z.string().describe("Specific type of task (e.g., 'Fumigación', 'Fertilización')."),
    responsibleId: z.string().describe("The ID of the collaborator responsible for the task."),
    startDate: z.string().describe("The start date of the task in 'yyyy-MM-dd' format."),
    status: z.enum(['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado']).default('Por realizar'),
    progress: z.number().default(0),
    plannedJournals: z.number().default(0).describe("Planned man-days for the task."),
    plannedCost: z.number().default(0),
    supplyCost: z.number().default(0),
    actualCost: z.number().default(0),
    plannedSupplies: z.array(
        z.object({
            supplyId: z.string().describe("The ID of the supply to be used, found in contextData."),
            quantity: z.number().positive().describe("The planned quantity of the supply."),
        })
    ).optional().describe("A list of supplies planned for this task. Use the 'supplies' array from contextData to find the correct supplyId."),
});

const AddStaffPayloadSchema = z.object({
    name: z.string().describe("Name of the collaborator."),
    contact: z.string().describe("Contact information for the collaborator."),
    employmentType: z.enum(["Permanente", "Temporal", "Contratista"]).describe("Type of employment."),
    baseDailyRate: z.number().describe("The new, positive daily rate for the collaborator. It must be greater than zero."),
});

const UpdateTaskStatusPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to update."),
  status: z.enum(['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado']).describe("The new status for the task."),
  progress: z.number().optional().describe("The new progress percentage (0-100). Should be 100 if status is 'Finalizado'."),
});

const UpdateStaffRatePayloadSchema = z.object({
    staffId: z.string().describe("The ID of the collaborator to update."),
    newRate: z.number().describe("The new, positive daily rate for the collaborator. It must be greater than zero."),
});

const DeleteTaskPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to delete."),
});

const DeleteStaffPayloadSchema = z.object({
  staffId: z.string().describe("The ID of the collaborator to delete."),
});

const AnswerPayloadSchema = z.object({
  text: z.string().describe("The direct, concise answer to the user's question."),
});

const ErrorPayloadSchema = z.object({
    message: z.string().describe("A clear and direct question in Spanish asking the user for the information that is missing to complete the command."),
});


// Union of all possible actions
const AssistantActionSchema = z.union([
  z.object({ action: z.literal('addProductiveUnit'), payload: AddProductiveUnitPayloadSchema }),
  z.object({ action: z.literal('addLot'), payload: AddLotPayloadSchema }),
  z.object({ action: z.literal('addTask'), payload: AddTaskPayloadSchema }),
  z.object({ action: z.literal('addStaff'), payload: AddStaffPayloadSchema }),
  z.object({ action: z.literal('updateTaskStatus'), payload: UpdateTaskStatusPayloadSchema }),
  z.object({ action: z.literal('updateStaffRate'), payload: UpdateStaffRatePayloadSchema }),
  z.object({ action: z.literal('deleteTask'), payload: DeleteTaskPayloadSchema }),
  z.object({ action: z.literal('deleteStaff'), payload: DeleteStaffPayloadSchema }),
  z.object({ action: z.literal('answer'), payload: AnswerPayloadSchema }),
  z.object({ action: z.literal('error'), payload: ErrorPayloadSchema }),
]);

// Define the input schema for the flow
const AssistantInputSchema = z.object({
  command: z.string().describe("The user's natural language command."),
  contextData: z.string().describe("A JSON string containing arrays of 'lots', 'staff' (collaborators), 'productiveUnits', 'tasks', and 'supplies' from the farm management system. Each object only contains the 'id' and 'name' (or 'type' for tasks). Use this to find IDs for existing items."),
  currentDate: z.string().describe("Today's date in yyyy-MM-dd format."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the flow
const AssistantOutputSchema = z.object({
    actions: z.array(AssistantActionSchema),
    explanation: z.string().describe("A single, brief confirmation sentence for the UI, covering all actions performed. e.g., 'OK. He creado la finca y el lote.', 'Aquí tienes la información que pediste.', or 'Disculpa, necesito un dato más.'"),
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
    You are an intelligent assistant AI for a farm management app. Your primary jobs are: 1. Translate user commands into a **sequence of one or more structured JSON actions**. 2. Answer questions based on the provided context data. You must be efficient and precise. Your output MUST ONLY be the final JSON object.

    **CRITICAL INSTRUCTIONS:**
    1.  **ANALYZE** the user's input to understand their intent. This can be creating new items, updating, deleting, asking a question, or a sequence of these.
    2.  **USE** the provided \`contextData\` JSON to find the exact \`id\` for any **existing** entities mentioned (lots, staff (collaborators), supplies, etc.).
    3.  **COMMAND SEQUENCING:**
        *   If the user gives multiple commands (e.g., "crea una finca y añádele un lote"), you MUST generate an array of actions in the \`actions\` field, in the correct logical order.
        *   For a single command, the \`actions\` array will have only one element.
    4.  **HANDLING DEPENDENCIES (VERY IMPORTANT):**
        *   If an action in the sequence depends on an item created in a *previous* action within the same command (e.g., adding a lot to a newly created farm), you MUST use a placeholder for the ID.
        *   Use the placeholder \`__ID_0__\` for the ID of the item created by the first action in the array, \`__ID_1__\` for the second, and so on.
        *   Example: For "crea una finca 'La Perla' y un lote 'Norte' dentro de ella", the \`addLot\` payload MUST use \`"productiveUnitId": "__ID_0__"\`.
    5.  **EXECUTING ACTIONS:**
        *   For creating, updating, or deleting, construct the appropriate JSON actions.
        *   When a user asks to change a task's status, use \`updateTaskStatus\`. If the new status is 'Finalizado', you MUST set the progress to 100.
        *   When creating a task, if the user mentions using supplies (e.g., "usando 100kg de abono"), you MUST identify the supply in the \`contextData\` and include it in the \`plannedSupplies\` array of the \`addTask\` payload.
    6.  **ANSWERING & ERRORS:**
        *   If the user asks a question, the \`actions\` array MUST contain a single \`answer\` action.
        *   If a command is ambiguous or missing information (like a responsible collaborator for a new task), the \`actions\` array MUST contain a single \`error\` action with a clear question for the user. Do not try to guess missing information.
    7.  **THE \`explanation\` FIELD:**
        *   This must be a single, brief confirmation sentence in Spanish that summarizes ALL actions performed, e.g., "OK. He creado la finca y el lote." or "Listo. He eliminado la labor y actualizado al colaborador."

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
      throw new Error("The AI assistant did not return a valid action sequence.");
    }
    return output;
  }
);
