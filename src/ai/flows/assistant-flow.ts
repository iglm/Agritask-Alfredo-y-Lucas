'use server';
/**
 * @fileOverview A command-dispatching AI assistant.
 *
 * - dispatchAction - A function that translates natural language into a structured, executable command.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { taskCategories } from '@/lib/types';

// Define the schemas for the individual actions.
const CreateTaskPayloadSchema = z.object({
  type: z.string().describe("El nombre específico de la labor. Ej: 'Fertilización NPK', 'Control de Maleza'."),
  lotId: z.string().describe("El ID del lote donde se realizará la labor."),
  responsibleId: z.string().describe("El ID del colaborador responsable."),
  startDate: z.string().describe("La fecha de inicio calculada en formato YYYY-MM-DD."),
  plannedJournals: z.number().describe("El número de jornales (días-hombre) planificados."),
  category: z.enum(taskCategories).describe("La categoría agronómica de la labor. La IA debe inferir la más apropiada."),
});

const CreateTaskActionSchema = z.object({
  action: z.literal("CREATE_TASK"),
  payload: CreateTaskPayloadSchema,
});

const IncomprehensibleActionSchema = z.object({
  action: z.literal("INCOMPREHENSIBLE"),
  payload: z.object({
    reason: z.string().describe("Una explicación breve de por qué no se pudo entender el comando o una parte de él."),
  }),
});

const ActionSchema = z.union([CreateTaskActionSchema, IncomprehensibleActionSchema]);

// The AI's output is a "plan" containing a list of actions and a summary.
const PlanSchema = z.object({
    summary: z.string().describe("Un resumen en lenguaje natural de las acciones que la IA va a ejecutar. Ej: 'Ok, crearé 2 labores y registraré 1 gasto.'"),
    plan: z.array(ActionSchema).describe("Un array de acciones estructuradas que se ejecutarán secuencialmente.")
});


// Define the input schema for the flow
const DispatcherInputSchema = z.object({
  command: z.string().describe("El comando de lenguaje natural del usuario."),
  context: z.string().describe("Un JSON string con arrays de 'lots' y 'staff' para mapear nombres a IDs."),
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas como 'mañana' o 'próximo lunes'."),
});
export type DispatcherInput = z.infer<typeof DispatcherInputSchema>;
export type DispatcherOutput = z.infer<typeof PlanSchema>;


/**
 * Public function to trigger the command dispatcher flow.
 * @param input The user command and context data.
 * @returns A promise that resolves to a structured action plan.
 */
export async function dispatchAction(input: Omit<DispatcherInput, 'currentDate'>): Promise<DispatcherOutput> {
    const today = new Date();
    const contextWithDate = {
        ...input,
        currentDate: today.toISOString().split('T')[0],
    };
  return commandDispatcherFlow(contextWithDate);
}

// Define the AI prompt for the command dispatcher
const dispatcherPrompt = ai.definePrompt({
  name: 'dispatcherPrompt',
  input: {schema: DispatcherInputSchema},
  output: {schema: PlanSchema},
  prompt: `
    You are an expert command dispatcher AI for a farm management application. Your primary directive is to convert a user's natural language command into a structured JSON plan of actions.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified 'PlanSchema'.
    2.  First, create a concise, conversational 'summary' of the actions you are about to take.
    3.  Then, create a 'plan' which is an ARRAY of action objects.
    4.  Currently, you can ONLY create tasks (action: "CREATE_TASK"). If the user asks to do anything else (create lots, staff, etc.), your 'summary' MUST state that you cannot do it yet, and the 'plan' array should be empty.
    5.  Use the 'context' JSON data to find the correct 'lotId' and 'responsibleId' from their names. If a name is ambiguous or not found, add an 'INCOMPREHENSIBLE' action to the plan explaining the issue.
    6.  Calculate dates based on the 'currentDate' ({{currentDate}}). "Mañana" is tomorrow, "pasado mañana" is the day after tomorrow. Always resolve to a 'YYYY-MM-DD' format.
    7.  Infer the most logical 'category' for the task. Examples: 'Fertilización' is 'Mantenimiento'. 'Cosechar' is 'Cosecha'. 'Limpiar' is 'Preparación'.
    8.  If a command contains multiple valid requests, create a separate action object for EACH request in the 'plan' array.

    EXAMPLE 1 (Single Task):
    - User: "Programa una fertilización en El Manantial para el próximo lunes con Carlos Pérez, 3 jornales."
    - Context: \`{"lots":[{"id":"lote-01","name":"El Manantial"}], "staff":[{"id":"staff-02","name":"Carlos Pérez"}]}\`
    - Your Output MUST BE:
        \`{
            "summary": "Entendido. Voy a programar una labor de fertilización en El Manantial.",
            "plan": [{
                "action": "CREATE_TASK",
                "payload": {
                    "type": "Fertilización",
                    "lotId": "lote-01",
                    "responsibleId": "staff-02",
                    "startDate": "YYYY-MM-DD", // (Calculated date of the next Monday)
                    "plannedJournals": 3,
                    "category": "Mantenimiento"
                }
            }]
        }\`
    
    EXAMPLE 2 (Multiple Tasks):
    - User: "Necesito una guadañada en La Cima mañana con Ana, y una siembra de café en El Mirador el viernes con Pedro, 4 jornales."
    - Your Output MUST BE:
        \`{
            "summary": "Claro, programaré 2 labores: una guadañada en La Cima y una siembra en El Mirador.",
            "plan": [
                {
                    "action": "CREATE_TASK",
                    "payload": { "type": "Guadañada", "lotId": "id_la_cima", "responsibleId": "id_ana", "startDate": "...", "plannedJournals": 1, "category": "Mantenimiento" }
                },
                {
                    "action": "CREATE_TASK",
                    "payload": { "type": "Siembra de café", "lotId": "id_el_mirador", "responsibleId": "id_pedro", "startDate": "...", "plannedJournals": 4, "category": "Siembra" }
                }
            ]
        }\`

    User's Command to process:
    "{{command}}"

    Context data (Lots and Staff):
    \`\`\`json
    {{context}}
    \`\`\`
  `,
});


// Define the Genkit flow
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
