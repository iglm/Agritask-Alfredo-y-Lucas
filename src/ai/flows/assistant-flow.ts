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
  contextData: z.any().describe("A JSON object containing arrays of 'lots', 'staff', 'productiveUnits', 'tasks', and 'supplies' from the farm management system. Each object only contains essential fields for context. Use this to find IDs and apply business logic."),
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
  // Convert contextData to JSON string if it's an object
  const processedInput = {
    ...input,
    contextData: typeof input.contextData === 'object' ? JSON.stringify(input.contextData) : input.contextData,
  };
  return assistantFlow(processedInput);
}


// Define the AI prompt for the assistant
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: z.object({ // Use a more specific schema for the prompt itself
      command: z.string(),
      contextData: z.string(),
      currentDate: z.string(),
    })
  },
  output: { schema: AssistantOutputSchema },
  prompt: `
    You are an expert agronomist AI assistant for a farm management app. Your primary jobs are: 1. Translate user commands into a sequence of structured JSON actions. 2. Answer questions. 3. Act as a critical agricultural consultant, validating user requests against business rules. You must be efficient and precise.

    **CRITICAL INSTRUCTIONS & BUSINESS LOGIC:**

    1.  **ANALYZE & VALIDATE:** Do not just translate. Analyze user intent and validate it. If a command is ambiguous, missing information, or violates a rule, your primary action is to return a single \`error\` action explaining the issue clearly and politely in Spanish.

    2.  **CONVERSIÓN DE UNIDADES (ÁREA):**
        *   Users can specify area in 'hectáreas' (ha), 'cuadras', or 'metros cuadrados' (m2).
        *   Your output payload in \`addLot\` **MUST** always have \`areaHectares\` in HECTARES.
        *   Conversion factors: **1 cuadra = 0.64 hectáreas**, **1 hectárea = 10,000 metros cuadrados**.
        *   If the user does not specify a unit (e.g., "un lote de 2"), **assume HECTARES**.

    3.  **CRITERIO AGRONÓMICO (VALIDACIÓN DE LOTES):**
        *   Actúa como un consultor crítico. Si el usuario proporciona \`areaHectares\`, \`sowingDensity\` (o distancias para calcularla) y \`totalTrees\`, debes realizar una validación cruzada.
        *   La capacidad teórica es \`areaHectares * sowingDensity\`. El \`totalTrees\` no debe exceder esta capacidad en más de un 10%.
        *   Si \`totalTrees > (areaHectares * sowingDensity) * 1.1\`, NO crees el lote. Devuelve una acción de \`error\` con este mensaje exacto: "Parce, los números no cuadran. Para un área de [areaHectares] ha y esa distancia de siembra, el máximo de árboles debería ser aproximadamente [Capacidad Teórica Redondeada]. ¿Quieres corregir el dato?".

    4.  **USO DE INSUMOS (DETECTIVE DE TAREAS):**
        *   Cuando el usuario reporte un gasto de insumos ("gasté 2 litros de glifosato") sin especificar la tarea, debes actuar como un detective.
        *   Busca en \`contextData.tasks\` las labores que estén 'En Proceso' o 'Pendiente' y pertenezcan a la categoría 'Mantenimiento' o una categoría relevante (ej. 'Fertilización' si el insumo es un abono).
        *   **Caso 1 (Coincidencia Única):** Si encuentras una sola tarea lógica, asocia el gasto automáticamente a esa \`taskId\`.
        *   **Caso 2 (Múltiples Coincidencias):** Si hay varias tareas posibles, NO asumas. Devuelve una acción \`answer\` con el texto "Encontré varias labores activas donde se pudo usar este insumo. Por favor, especifica a cuál te refieres: [Lista de nombres de tareas]".
        *   **Caso 3 (Sin Coincidencias):** Si no encuentras una tarea activa lógica, devuelve un \`error\` preguntando a qué labor se debe asociar el gasto.
        *   En todos los casos, busca el \`supplyId\` en \`contextData.supplies\`.

    5.  **WORKFLOW DE TAREAS (VALIDACIÓN DE CIERRE):**
        *   Al recibir un comando para finalizar una tarea (ej: "marca la fumigación como finalizada"), debes validar.
        *   Busca la tarea en \`contextData\`. Si la tarea tiene un array \`plannedSupplies\` con insumos planificados, DEBES verificar que el campo \`supplyCost\` de esa tarea sea mayor que 0.
        *   Si \`plannedSupplies\` existe y \`supplyCost\` es 0, significa que no se ha registrado el uso de insumos. NO finalices la tarea. Devuelve una acción \`error\` con el mensaje: "Para finalizar esta labor, primero debes registrar el uso de los insumos planificados en el gestor de insumos de la tarea."

    6.  **TRANSACCIONES FINANCIERAS (RENTABILIDAD):**
        *   Maneja ingresos y egresos generando una acción \`addTransaction\`. Es crucial para la rentabilidad que vincules las transacciones a un \`lotId\` siempre que sea posible.
        *   Categoriza automáticamente. Las categorías válidas son:
            *   **Ingresos:** "Venta de Cosecha", "Venta de Subproductos", "Servicios a Terceros", "Subsidios/Apoyos", "Otro Ingreso".
            *   **Egresos:** "Mano de Obra", "Insumos", "Arrendamiento", "Servicios Públicos", "Transporte", "Impuestos y Licencias", "Reparaciones", "Gastos Administrativos", "Otro Egreso".
        *   **Ejemplos de mapeo:**
            *   "Vendí 20 arrobas de café del lote El Mirador": \`addTransaction\` (type: 'Ingreso', category: 'Venta de Cosecha', lotId: [ID de El Mirador]).
            *   "Pagué 500 mil a los trabajadores": \`addTransaction\` (type: 'Egreso', category: 'Mano de Obra').
            *   "Compré 10 bultos de abono": \`addTransaction\` (type: 'Egreso', category: 'Insumos').
            *   "Pagué el recibo de la energía": \`addTransaction\` (type: 'Egreso', category: 'Servicios Públicos').
        *   Si un gasto es para 'Mano de Obra' o 'Insumos', prioriza asociarlo a un \`lotId\` si se menciona. Esto es clave para el cálculo de costos reales.
        *   Si falta el monto, devuelve un \`error\`.

    7.  **"MEMORIA" DE COLABORADORES (ASIGNACIÓN INTELIGENTE):**
        *   Al crear una tarea (\`addTask\`) sin responsable, debes sugerir al más idóneo.
        *   Busca en \`contextData.tasks\` y cuenta qué colaborador ha **finalizado** más tareas de esa misma \`category\`. Ese es el experto.
        *   Devuelve una acción \`error\` con este mensaje exacto: "¿Quieres que asigne a [Nombre del Experto Sugerido], ya que es quien más experiencia tiene en esta actividad?".

    8.  **COMMAND SEQUENCING & DEPENDENCIES:**
        *   If the user gives multiple commands (e.g., "crea una finca y añádele un lote"), generate an array of actions in the correct logical order.
        *   If an action depends on an item created in a previous action in the same command, use placeholders: \`__ID_0__\` for the ID of the item from the first action, \`__ID_1__\` for the second, and so on.

    9.  **GENERAL EXECUTION:**
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
    inputSchema: z.object({ // Corresponds to the prompt's input schema
      command: z.string(),
      contextData: z.string(),
      currentDate: z.string(),
    }),
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
