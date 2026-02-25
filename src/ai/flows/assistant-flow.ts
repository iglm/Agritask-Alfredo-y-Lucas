'use server';
/**
 * @fileOverview An AI assistant that converts natural language into executable actions, acting as an agricultural consultant.
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
  areaHectares: z.number().positive().describe("Area of the lot, ALWAYS converted to hectares."),
  location: z.string().optional().describe("Location of the lot (Vereda/Sector)."),
  technicalNotes: z.string().optional().describe("Technical notes about the lot."),
  sowingDate: z.string().optional().describe("The sowing date in 'yyyy-MM-dd' format."),
  totalTrees: z.number().int().positive().optional().describe("Total number of trees, calculated from density if possible."),
  sowingDensity: z.number().positive().optional().describe("Sowing density in trees per hectare, calculated from distances if possible."),
});


const AddTaskPayloadSchema = z.object({
    lotId: z.string().describe("The ID of the lot where the task takes place."),
    category: z.enum(["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"]).describe("Category of the task."),
    type: z.string().describe("Specific type of task (e.g., 'Fumigación', 'Fertilización')."),
    responsibleId: z.string().describe("The ID of the collaborator responsible for the task. If not provided by the user, you must suggest one."),
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
    baseDailyRate: z.number().positive().describe("The new, positive daily rate for the collaborator. It must be greater than zero."),
});

const UpdateTaskStatusPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to update."),
  status: z.enum(['Por realizar', 'En Proceso', 'Pendiente', 'Finalizado']).describe("The new status for the task."),
  progress: z.number().optional().describe("The new progress percentage (0-100). Should be 100 if status is 'Finalizado'."),
});

const UpdateStaffRatePayloadSchema = z.object({
    staffId: z.string().describe("The ID of the collaborator to update."),
    newRate: z.number().positive().describe("The new, positive daily rate for the collaborator. It must be greater than zero."),
});

const DeleteTaskPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to delete."),
});

const DeleteStaffPayloadSchema = z.object({
  staffId: z.string().describe("The ID of the collaborator to delete."),
});

// New schema for recording supply usage
const RecordSupplyUsagePayloadSchema = z.object({
    taskId: z.string().describe("The ID of the task where the supply was used. You must find the most logical active or recent task based on the user's command."),
    supplyId: z.string().describe("The ID of the supply used, found in `contextData.supplies`."),
    quantityUsed: z.number().positive().describe("The amount of the supply that was used."),
    date: z.string().describe("The date the supply was used, in 'yyyy-MM-dd' format. Default to `currentDate` if not specified."),
});

// New schema for financial transactions
const AddTransactionPayloadSchema = z.object({
    type: z.enum(['Ingreso', 'Egreso']).describe("The type of transaction."),
    date: z.string().describe("The date of the transaction in 'yyyy-MM-dd' format."),
    description: z.string().describe("A detailed description of the transaction."),
    amount: z.number().positive().describe("The monetary value of the transaction."),
    category: z.string().describe("The financial category. Must be one of the predefined categories."),
    lotId: z.string().optional().describe("The ID of the associated lot, if mentioned."),
});


const AnswerPayloadSchema = z.object({
  text: z.string().describe("The direct, concise answer to the user's question."),
});

const ErrorPayloadSchema = z.object({
    message: z.string().describe("A clear and direct question in Spanish asking the user for the information that is missing, or an educational message explaining a business rule violation."),
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
  z.object({ action: z.literal('recordSupplyUsage'), payload: RecordSupplyUsagePayloadSchema }),
  z.object({ action: z.literal('addTransaction'), payload: AddTransactionPayloadSchema }),
  z.object({ action: z.literal('answer'), payload: AnswerPayloadSchema }),
  z.object({ action: z.literal('error'), payload: ErrorPayloadSchema }),
]);

// Define the input schema for the flow
const AssistantInputSchema = z.object({
  command: z.string().describe("The user's natural language command."),
  contextData: z.string().describe("A JSON string containing arrays of 'lots', 'staff' (collaborators), 'productiveUnits', 'tasks', and 'supplies' from the farm management system. Each object only contains essential fields like 'id', 'name', 'type', 'employmentType', etc. Use this to find IDs and apply business logic."),
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
    You are an expert agronomist AI assistant for a farm management app. Your primary jobs are: 1. Translate user commands into a sequence of structured JSON actions. 2. Answer questions. 3. Act as a critical agricultural consultant, validating user requests against business rules. You must be efficient and precise.

    **CRITICAL INSTRUCTIONS & BUSINESS LOGIC:**

    1.  **ANALYZE & VALIDATE:** Do not just translate. Analyze user intent and validate it. If a command is ambiguous, missing information, or violates a rule, your primary action is to return a single \`error\` action explaining the issue clearly and politely in Spanish.

    2.  **UNIT CONVERSION (AREA):**
        *   When creating a lot, users may specify area in 'hectáreas', 'cuadras', or 'metros cuadrados'.
        *   Your output payload in \`addLot\` **MUST** always have \`areaHectares\` in HECTARES.
        *   Conversion factors: **1 cuadra = 0.64 hectáreas**, **1 hectárea = 10,000 metros cuadrados**.
        *   If the user does not specify a unit (e.g., "un lote de 2"), **assume HECTARES**.

    3.  **AGRICULTURAL VALIDATION (LOTS):**
        *   When a user creates a lot with density/tree information, you MUST validate it.
        *   The rule is: \`totalTrees\` cannot exceed \`areaHectares * sowingDensity\`.
        *   If this rule is violated, do NOT create the lot. Instead, return a single \`error\` action with an educational message explaining that the number of trees is physically impossible for the given area and density.

    4.  **SUPPLY USAGE (INVENTORY):**
        *   Users can report actual supply usage with commands like "gasté 2 bultos de urea en la fertilización del lote X".
        *   Your job is to generate a \`recordSupplyUsage\` action.
        *   To do this, you must infer the \`taskId\`. Find the most recent, active ('En Proceso' or 'Por realizar') task on the specified lot that logically matches the action (e.g., a 'Fertilización' task for a fertilizer usage report). If you cannot determine the task unambiguously, return an \`error\` action asking for clarification.
        *   Find the \`supplyId\` from the \`contextData.supplies\`.
        *   The \`date\` should be \`currentDate\` unless specified.

    5.  **FINANCIAL TRANSACTIONS:**
        *   Users can report income or expenses. Generate an \`addTransaction\` action.
        *   Categorize automatically based on keywords.
            *   **Ingresos:** "venta", "vendí" -> category: 'Venta de Cosecha'. "subsidio", "apoyo" -> 'Subsidios/Apoyos'.
            *   **Egresos:** "pagué", "compré", "gasté en" -> "recibo de energía/agua" -> 'Servicios Públicos'. "gasolina", "transporte" -> 'Transporte'. "reparación", "mantenimiento" -> 'Reparaciones'.
            *   Income Categories: "Venta de Cosecha", "Venta de Subproductos", "Servicios a Terceros", "Subsidios/Apoyos", "Otro Ingreso".
            *   Expense Categories: "Arrendamiento", "Servicios Públicos", "Transporte", "Impuestos y Licencias", "Reparaciones", "Gastos Administrativos", "Otro Egreso".
        *   If a lot is mentioned, include the \`lotId\`. If not, it's a general transaction.
        *   If the user does not specify the monetary amount, you MUST return an \`error\` action asking for it.

    6.  **INTELLIGENT TASK ASSIGNMENT:**
        *   When creating a task (\`addTask\`), if the user does NOT provide a responsible person, you should suggest one.
        *   Analyze the \`contextData.tasks\` to find who most frequently performs tasks of the same \`category\`.
        *   Return an \`error\` action asking for confirmation: "No especificaste un responsable. ¿Quieres que asigne a [Nombre del Colaborador Sugerido], quien usualmente hace este tipo de labor?".

    7.  **COMMAND SEQUENCING & DEPENDENCIES:**
        *   If the user gives multiple commands (e.g., "crea una finca y añádele un lote"), generate an array of actions in the correct logical order.
        *   If an action depends on an item created in a previous action in the same command, use placeholders: \`__ID_0__\` for the ID of the item from the first action, \`__ID_1__\` for the second, and so on.

    8.  **GENERAL EXECUTION:**
        *   Use \`contextData\` to find IDs for existing entities. Do not guess IDs.
        *   The \`explanation\` field must be a single, brief confirmation sentence in Spanish summarizing ALL successful actions.

    **User Command:** \`{{{command}}}\`
    **JSON Context Data & Date:** \`{{{contextData}}}\`, Current Date: \`{{{currentDate}}}\`
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
