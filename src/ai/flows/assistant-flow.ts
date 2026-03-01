'use server';
/**
 * @fileOverview A command-dispatching AI assistant.
 *
 * - dispatchAction - A function that translates natural language into a structured, executable command.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { taskCategories } from '@/lib/types';
import { format, addDays, nextMonday, startOfDay } from 'date-fns';


// Define the schemas for the output actions.
// This is what the AI will generate.

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
    reason: z.string().describe("Una explicación breve de por qué no se pudo entender el comando."),
  }),
});

const ActionSchema = z.union([CreateTaskActionSchema, IncomprehensibleActionSchema]);

// Define the input schema for the flow
const DispatcherInputSchema = z.object({
  command: z.string().describe("El comando de lenguaje natural del usuario."),
  context: z.string().describe("Un JSON string con arrays de 'lots' y 'staff' para mapear nombres a IDs."),
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas como 'mañana' o 'próximo lunes'."),
});
export type DispatcherInput = z.infer<typeof DispatcherInputSchema>;
export type DispatcherOutput = z.infer<typeof ActionSchema>;


/**
 * Public function to trigger the command dispatcher flow.
 * @param input The user command and context data.
 * @returns A promise that resolves to a structured action.
 */
export async function dispatchAction(input: Omit<DispatcherInput, 'currentDate'>): Promise<DispatcherOutput> {
    const today = startOfDay(new Date());
    const contextWithDate = {
        ...input,
        currentDate: format(today, 'yyyy-MM-dd'),
    };
  return commandDispatcherFlow(contextWithDate);
}

// Define the AI prompt for the command dispatcher
const dispatcherPrompt = ai.definePrompt({
  name: 'dispatcherPrompt',
  input: {schema: DispatcherInputSchema},
  output: {schema: ActionSchema},
  prompt: `
    You are an expert command dispatcher AI for a farm management application. Your primary directive is to convert a user's natural language command into a structured JSON action object.

    STRICT INSTRUCTIONS:
    0.  Your ONLY capability is to create a single task (labor). If the user asks to create a farm (finca), lots (lotes), staff, or anything other than a single task, you MUST return an 'INCOMPREHENSIBLE' action. Your reason should state 'Actualmente solo puedo crear labores. La creación de fincas y lotes desde el asistente aún está en desarrollo.'. Do not attempt to process the request further.
    1.  Your response MUST be a valid JSON object that conforms to ONE of the action schemas provided. Do NOT include any text, commentary, or explanations outside of the JSON structure.
    2.  Use the 'context' JSON data to find the correct 'lotId' and 'responsibleId' from their names. If a name is ambiguous or not found, you MUST return an 'INCOMPREHENSIBLE' action.
    3.  Calculate dates based on the 'currentDate' ({{currentDate}}). "Mañana" is tomorrow, "pasado mañana" is the day after tomorrow, "próximo lunes" is the coming Monday. Always resolve to a 'YYYY-MM-DD' format.
    4.  Infer the most logical 'category' for the task. Examples: 'Fertilización' or 'Abono' is 'Mantenimiento'. 'Cosechar' or 'Recolectar' is 'Cosecha'. 'Arar' or 'Limpiar' is 'Preparación'. 'Fumigar' is 'Mantenimiento'.
    5.  If any crucial information (lot name, responsible name, task name, or a date reference) is missing from the user's command, you MUST return an 'INCOMPREHENSIBLE' action explaining exactly what information is missing.
    6.  Be precise. If the user says "Fertilización", the 'type' in the payload should be "Fertilización". Do not add extra words.

    EXAMPLE:
    -   User Command: "Programa una fertilización en El Manantial para el próximo lunes con Carlos Pérez, 3 jornales."
    -   Context: \`{"lots":[{"id":"lote-01","name":"El Manantial"}], "staff":[{"id":"staff-02","name":"Carlos Pérez"}]}\`
    -   Your Output MUST BE:
        \`{
            "action": "CREATE_TASK",
            "payload": {
                "type": "Fertilización",
                "lotId": "lote-01",
                "responsibleId": "staff-02",
                "startDate": "YYYY-MM-DD", // (Calculated date of the next Monday)
                "plannedJournals": 3,
                "category": "Mantenimiento"
            }
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
    outputSchema: ActionSchema,
  },
  async (input) => {
    const {output} = await dispatcherPrompt(input);
    if (!output) {
      throw new Error("El asistente de IA no retornó una acción válida.");
    }
    return output;
  }
);
