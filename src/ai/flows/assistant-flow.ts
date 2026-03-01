'use server';
/**
 * @fileOverview A command-dispatching AI assistant.
 *
 * - dispatchAction - A function that translates natural language into a structured, executable command.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { employmentTypes, taskCategories, supplyUnits, incomeCategories, expenseCategories } from '@/lib/types';

// Define the schemas for the individual actions.

// -- TASK --
const PlannedSupplySchema = z.object({
  supplyId: z.string().describe("The ID of the supply to be used."),
  quantity: z.number().describe("The quantity of the supply planned for the task."),
});

const CreateTaskPayloadSchema = z.object({
  type: z.string().describe("El nombre específico de la labor. Ej: 'Fertilización NPK', 'Control de Maleza'."),
  lotId: z.string().describe("El ID del lote donde se realizará la labor."),
  responsibleId: z.string().describe("El ID del colaborador responsable."),
  startDate: z.string().describe("La fecha de inicio calculada en formato YYYY-MM-DD."),
  plannedJournals: z.number().describe("El número de jornales (días-hombre) planificados. Por defecto es 1 si no se especifica."),
  category: z.enum(taskCategories).describe("La categoría agronómica de la labor. La IA debe inferir la más apropiada."),
  plannedSupplies: z.array(PlannedSupplySchema).optional().describe("Una lista de insumos planificados para esta labor, si se mencionan en el comando."),
});

const CreateTaskActionSchema = z.object({
  action: z.literal("CREATE_TASK"),
  payload: CreateTaskPayloadSchema,
});


// -- PRODUCTIVE UNIT --
const CreateProductiveUnitPayloadSchema = z.object({
    farmName: z.string().describe("El nombre de la finca o unidad productiva."),
    municipality: z.string().optional().describe("El municipio donde se encuentra."),
    department: z.string().optional().describe("El departamento donde se encuentra."),
});

const CreateProductiveUnitActionSchema = z.object({
    action: z.literal("CREATE_PRODUCTIVE_UNIT"),
    payload: CreateProductiveUnitPayloadSchema,
});


// -- LOT --
const CreateLotPayloadSchema = z.object({
    name: z.string().describe("El nombre del lote. Ej: 'El Mirador'"),
    productiveUnitId: z.string().describe("El ID de la unidad productiva a la que pertenece este lote."),
    areaHectares: z.number().describe("El área del lote en hectáreas."),
    crop: z.string().optional().describe("El cultivo principal del lote, si es productivo. Ej: 'Café', 'Plátano'."),
});

const CreateLotActionSchema = z.object({
    action: z.literal("CREATE_LOT"),
    payload: CreateLotPayloadSchema,
});


// -- STAFF --
const CreateStaffPayloadSchema = z.object({
    name: z.string().describe("El nombre completo del colaborador."),
    baseDailyRate: z.number().describe("La tarifa o jornal diario que se le paga al colaborador."),
    employmentType: z.enum(employmentTypes).describe("El tipo de contrato o empleo."),
    contact: z.string().optional().describe("El número de teléfono o contacto del colaborador."),
});

const CreateStaffActionSchema = z.object({
    action: z.literal("CREATE_STAFF"),
    payload: CreateStaffPayloadSchema,
});

// -- SUPPLY --
const CreateSupplyPayloadSchema = z.object({
    name: z.string().describe("El nombre del insumo. Ej: 'Urea', 'Glifosato'."),
    unitOfMeasure: z.enum(supplyUnits).describe("La unidad de medida. Debe ser una de las opciones válidas."),
    costPerUnit: z.number().describe("El costo por cada unidad del insumo."),
    currentStock: z.number().describe("La cantidad inicial en inventario."),
});

const CreateSupplyActionSchema = z.object({
    action: z.literal("CREATE_SUPPLY"),
    payload: CreateSupplyPayloadSchema,
});


// -- TRANSACTION --
const CreateTransactionPayloadSchema = z.object({
    type: z.enum(["Ingreso", "Egreso"]).describe("El tipo de transacción, inferido del comando del usuario ('gasto', 'compra' son Egresos; 'venta', 'pago recibido' son Ingresos)."),
    description: z.string().describe("La descripción del movimiento."),
    amount: z.number().describe("El monto de la transacción."),
    category: z.string().describe("La categoría inferida de la transacción. Debe ser una de las categorías válidas para el tipo."),
    lotId: z.string().optional().describe("El ID del lote asociado, si se menciona. Si es un gasto general, se omite."),
    date: z.string().describe("La fecha de la transacción en formato YYYY-MM-DD. Por defecto es la fecha actual si no se especifica."),
});

const CreateTransactionActionSchema = z.object({
    action: z.literal("CREATE_TRANSACTION"),
    payload: CreateTransactionPayloadSchema,
});


// -- UNION & PLAN --
const IncomprehensibleActionSchema = z.object({
  action: z.literal("INCOMPREHENSIBLE"),
  payload: z.object({
    reason: z.string().describe("Una explicación breve de por qué no se pudo entender el comando o una parte de él."),
  }),
});

const ActionSchema = z.union([
    CreateTaskActionSchema, 
    CreateProductiveUnitActionSchema, 
    CreateLotActionSchema,
    CreateStaffActionSchema,
    CreateSupplyActionSchema,
    CreateTransactionActionSchema,
    IncomprehensibleActionSchema
]);

const PlanSchema = z.object({
    summary: z.string().describe("Un resumen en lenguaje natural de las acciones que la IA va a ejecutar. Ej: 'Entendido, crearé la finca La Esperanza.' o 'Claro, voy a crear 2 labores.'"),
    plan: z.array(ActionSchema).describe("Un array de acciones estructuradas que se ejecutarán secuencialmente.")
});


// -- FLOW --
const DispatcherInputSchema = z.object({
  command: z.string().describe("El comando de lenguaje natural del usuario."),
  context: z.string().describe("Un JSON string con arrays de 'productiveUnits', 'lots', 'staff' y 'supplies' para mapear nombres a IDs."),
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas como 'mañana' o 'próximo lunes'."),
});
export type DispatcherInput = z.infer<typeof DispatcherInputSchema>;
export type DispatcherOutput = z.infer<typeof PlanSchema>;

export async function dispatchAction(input: Omit<DispatcherInput, 'currentDate'>): Promise<DispatcherOutput> {
    const today = new Date();
    const contextWithDate = {
        ...input,
        currentDate: today.toISOString().split('T')[0],
    };
  return commandDispatcherFlow(contextWithDate);
}

const dispatcherPrompt = ai.definePrompt({
  name: 'dispatcherPrompt',
  input: {schema: DispatcherInputSchema},
  output: {schema: PlanSchema},
  prompt: `
    You are an expert command dispatcher AI for a farm management application. Your primary directive is to convert a user's natural language command into a structured JSON plan of actions.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the 'PlanSchema'.
    2.  First, create a concise, conversational 'summary' of the actions you are about to take. This summary MUST mention any supplies being planned.
    3.  Then, create a 'plan' which is an ARRAY of action objects.
    4.  You can create Productive Units (Fincas), Lots, Staff, Tasks, Supplies (Insumos), and Transactions (Ingresos/Egresos).
    5.  CRITICAL: If the user asks for bulk creation (e.g., "create 10 lots", "add 50 workers"), you MUST respond with an 'INCOMPREHENSIBLE' action. Your reason should be: "Aún no puedo procesar creaciones masivas. Para eso, usa el Constructor IA desde el menú principal.".
    6.  For commands involving multiple, distinct actions (e.g., "create a lot and then a task"), create a separate action object for EACH request in the 'plan' array.
    7.  Use the 'context' JSON data to find the correct IDs from names ('productiveUnitId', 'lotId', 'responsibleId', 'supplyId'). If a name is ambiguous or not found, use an 'INCOMPREHENSIBLE' action.
    8.  Calculate dates based on 'currentDate' ({{currentDate}}). Resolve relative dates like "mañana" to 'YYYY-MM-DD' format.
    9.  Infer logical defaults. For 'CREATE_TASK', 'plannedJournals' defaults to 1. For 'CREATE_STAFF', 'employmentType' defaults to 'Temporal'. For 'CREATE_LOT', if a crop is mentioned, it's a 'Productivo' lot.
    10. For 'CREATE_SUPPLY', infer 'unitOfMeasure' from: [${supplyUnits.join(', ')}].
    11. For 'CREATE_TRANSACTION', infer the 'type'. 'Gasto', 'compra', 'egreso' mean 'Egreso'. 'Venta', 'recibí pago', 'ingreso' mean 'Ingreso'. For 'Ingreso', infer 'category' from: [${incomeCategories.join(', ')}]. For 'Egreso', infer 'category' from: [${expenseCategories.join(', ')}]. If a lot is mentioned, include its 'lotId'. The date defaults to today.
    12. **NEW: Supply Planning in Tasks:** If a 'CREATE_TASK' command mentions supplies (e.g., "con 2 bultos de urea"), you MUST parse the quantity and name, find the 'supplyId' from context, and add it to the 'plannedSupplies' array in the task payload.
    13. **DETECT ANALYTICAL QUERIES:** Your role is STRICTLY for data entry commands. If the user asks a question or requests analysis, summary, optimization, or diagnosis (e.g., '¿Hay problemas?', 'Analiza mis costos', 'Optimiza la semana'), you MUST NOT generate a plan. Instead, your response must be a single 'INCOMPREHENSIBLE' action. The reason MUST be: "Esa es una excelente pregunta, pero mi especialidad es registrar datos. Para análisis detallados, por favor usa los Agentes de IA especializados en el Panel Principal."

    CONTEXT DATA (Productive Units, Lots, Staff, and Supplies):
    \`\`\`json
    {{context}}
    \`\`\`

    User's Command: "{{command}}"

    --- EXAMPLES OF YOUR REQUIRED JSON OUTPUT ---

    // Example: Create Task with Supplies
    // User: "Programa una fertilización en El Filo para mañana con Mario, usa 2 bultos de Urea y 1 de Abono NPK"
    {
      "summary": "Entendido. Voy a programar la labor de fertilización, planificando el uso de 2 bultos de Urea y 1 de Abono NPK.",
      "plan": [{
        "action": "CREATE_TASK",
        "payload": { 
            "type": "Fertilización", 
            "lotId": "id_de_el_filo", 
            "responsibleId": "id_de_mario", 
            "startDate": "...", 
            "plannedJournals": 1, 
            "category": "Mantenimiento",
            "plannedSupplies": [
                { "supplyId": "id_de_urea", "quantity": 2 },
                { "supplyId": "id_de_abono_npk", "quantity": 1 }
            ]
        }
      }]
    }
    
    // Example: Create Supply
    // User: "Registra el insumo 'Abono NPK' en Bultos a 120000, tengo 20"
    {
        "summary": "Entendido. Voy a registrar el 'Abono NPK' en tu inventario.",
        "plan": [{
            "action": "CREATE_SUPPLY",
            "payload": { "name": "Abono NPK", "unitOfMeasure": "Bulto", "costPerUnit": 120000, "currentStock": 20 }
        }]
    }
    
    // Example: Deflect Analysis Query
    // User: "¿Hay alguna anomalía en mis costos?"
    {
        "summary": "Esa es una pregunta para otro agente.",
        "plan": [{
            "action": "INCOMPREHENSIBLE",
            "payload": { "reason": "Esa es una excelente pregunta, pero mi especialidad es registrar datos. Para análisis detallados, por favor usa los Agentes de IA especializados en el Panel Principal." }
        }]
    }
  `,
});


const commandDispatcherFlow = ai.defineFlow(
  {
    name: 'commandDispatcherFlow',
    inputSchema: DispatcherInputSchema,
    outputSchema: PlanSchema,
  },
  async (input) => {
    const {output} = await dispatcherPrompt(input);
    if (!output) {
      throw new Error("El asistente de IA no retornó un plan de acción válido.");
    }
    return output;
  }
);
