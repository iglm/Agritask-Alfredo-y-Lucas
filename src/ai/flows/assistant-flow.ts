'use server';
/**
 * @fileOverview A command-dispatching AI assistant.
 *
 * - dispatchAction - A function that translates natural language into a structured, executable command.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { employmentTypes, taskCategories } from '@/lib/types';

// Define the schemas for the individual actions.

// -- TASK --
const CreateTaskPayloadSchema = z.object({
  type: z.string().describe("El nombre específico de la labor. Ej: 'Fertilización NPK', 'Control de Maleza'."),
  lotId: z.string().describe("El ID del lote donde se realizará la labor."),
  responsibleId: z.string().describe("El ID del colaborador responsable."),
  startDate: z.string().describe("La fecha de inicio calculada en formato YYYY-MM-DD."),
  plannedJournals: z.number().describe("El número de jornales (días-hombre) planificados. Por defecto es 1 si no se especifica."),
  category: z.enum(taskCategories).describe("La categoría agronómica de la labor. La IA debe inferir la más apropiada."),
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
    IncomprehensibleActionSchema
]);

const PlanSchema = z.object({
    summary: z.string().describe("Un resumen en lenguaje natural de las acciones que la IA va a ejecutar. Ej: 'Entendido, crearé la finca La Esperanza.' o 'Claro, voy a crear 2 labores.'"),
    plan: z.array(ActionSchema).describe("Un array de acciones estructuradas que se ejecutarán secuencialmente.")
});


// -- FLOW --
const DispatcherInputSchema = z.object({
  command: z.string().describe("El comando de lenguaje natural del usuario."),
  context: z.string().describe("Un JSON string con arrays de 'productiveUnits', 'lots' y 'staff' para mapear nombres a IDs."),
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
    2.  First, create a concise, conversational 'summary' of the actions you are about to take.
    3.  Then, create a 'plan' which is an ARRAY of action objects.
    4.  You can create Productive Units (Fincas), Lots, Staff, and Tasks.
    5.  CRITICAL: If the user asks for bulk creation (e.g., "create 10 lots", "add 50 workers"), you MUST respond with an 'INCOMPREHENSIBLE' action. Your reason should be: "Aún no puedo procesar creaciones masivas. Por favor, crea una entidad a la vez.".
    6.  For commands involving multiple, distinct actions (e.g., "create a lot and then a task"), create a separate action object for EACH request in the 'plan' array.
    7.  Use the 'context' JSON data to find the correct IDs from names ('productiveUnitId', 'lotId', 'responsibleId'). If a name is ambiguous or not found, use an 'INCOMPREHENSIBLE' action.
    8.  Calculate dates based on 'currentDate' ({{currentDate}}). Resolve relative dates like "mañana" to 'YYYY-MM-DD' format.
    9.  Infer logical defaults. For 'CREATE_TASK', 'plannedJournals' defaults to 1. For 'CREATE_STAFF', 'employmentType' defaults to 'Temporal'. For 'CREATE_LOT', if a crop is mentioned, it's a 'Productivo' lot.

    CONTEXT DATA (Productive Units, Lots, and Staff):
    \`\`\`json
    {{context}}
    \`\`\`

    User's Command: "{{command}}"

    --- EXAMPLES OF YOUR REQUIRED JSON OUTPUT ---
    
    // Example: Create Productive Unit
    // User: "Crea la finca La Esperanza en Jardín, Antioquia"
    {
        "summary": "Entendido. Creando la unidad productiva 'La Esperanza'.",
        "plan": [{
            "action": "CREATE_PRODUCTIVE_UNIT",
            "payload": { "farmName": "La Esperanza", "municipality": "Jardín", "department": "Antioquia" }
        }]
    }

    // Example: Create Lot
    // User: "Añade un lote de 5 hectáreas llamado El Filo a la finca La Esperanza, cultiva café."
    {
        "summary": "Ok, voy a añadir el lote 'El Filo' a 'La Esperanza'.",
        "plan": [{
            "action": "CREATE_LOT",
            "payload": { "name": "El Filo", "productiveUnitId": "id_de_la_esperanza", "areaHectares": 5, "crop": "Café" }
        }]
    }

    // Example: Create Staff
    // User: "Registra al trabajador Mario, jornal a 55000"
    {
        "summary": "Registrando al nuevo colaborador Mario.",
        "plan": [{
            "action": "CREATE_STAFF",
            "payload": { "name": "Mario", "baseDailyRate": 55000, "employmentType": "Temporal" }
        }]
    }
    
    // Example: Create multiple Tasks
    // User: "Programa guadaña en El Filo para mañana con Mario, y una fertilización en La Cima el viernes con Ana"
    {
        "summary": "Claro, programaré 2 labores: una guadañada y una fertilización.",
        "plan": [
            {
                "action": "CREATE_TASK",
                "payload": { "type": "Guadaña", "lotId": "id_el_filo", "responsibleId": "id_mario", "startDate": "...", "plannedJournals": 1, "category": "Mantenimiento" }
            },
            {
                "action": "CREATE_TASK",
                "payload": { "type": "Fertilización", "lotId": "id_la_cima", "responsibleId": "id_ana", "startDate": "...", "plannedJournals": 1, "category": "Mantenimiento" }
            }
        ]
    }
    
    // Example: Bulk creation (NOT SUPPORTED)
    // User: "crea 10 lotes y 50 trabajadores"
    {
        "summary": "Lo siento, todavía no puedo procesar solicitudes masivas.",
        "plan": [{
            "action": "INCOMPREHENSIBLE",
            "payload": { "reason": "Aún no puedo procesar creaciones masivas. Por favor, crea una entidad a la vez." }
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
