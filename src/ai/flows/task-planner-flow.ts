'use server';
/**
 * @fileOverview An agricultural planning AI agent.
 *
 * - generateTaskPlan - A function that creates a 12-month work plan for a specific lot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the structure for a single proposed task by the AI
const ProposedTaskSchema = z.object({
  category: z.enum(["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"]).describe("The category of the task."),
  type: z.string().describe("A specific, descriptive name for the task (e.g., 'Primera Fertilización NPK', 'Control de Broca')."),
  startDate: z.string().describe("The suggested start date for the task in 'yyyy-MM-dd' format, relative to the lot's sowing date."),
  plannedJournals: z.number().describe("An estimated number of man-days (jornales) required to complete the task, based on the lot's area and the nature of the task."),
  observations: z.string().optional().describe("A brief explanation of why this task is important at this specific time in the cultivation cycle."),
});

// Define the input schema for the flow
const TaskPlannerInputSchema = z.object({
  crop: z.string().describe("The primary crop grown in this lot (e.g., 'Café', 'Aguacate')."),
  sowingDate: z.string().describe("The lot's sowing date in 'yyyy-MM-dd' format. This is the reference point for the entire plan."),
  areaHectares: z.number().describe("The area of the lot in hectares, used to scale the effort required for tasks."),
});
export type TaskPlannerInput = z.infer<typeof TaskPlannerInputSchema>;

// Define the output schema for the flow
const TaskPlannerOutputSchema = z.object({
    plannedTasks: z.array(ProposedTaskSchema).describe("A list of proposed tasks for a 12-month cycle. Should not be empty.")
});
export type TaskPlannerOutput = z.infer<typeof TaskPlannerOutputSchema>;

/**
 * Public function to trigger the task planning flow.
 * @param input The lot data to generate a plan for.
 * @returns A promise that resolves to the list of proposed tasks.
 */
export async function generateTaskPlan(input: TaskPlannerInput): Promise<TaskPlannerOutput> {
  return taskPlannerFlow(input);
}

// Define the AI prompt for task planning
const taskPlannerPrompt = ai.definePrompt({
  name: 'taskPlannerPrompt',
  input: {schema: TaskPlannerInputSchema},
  output: {schema: TaskPlannerOutputSchema},
  prompt: `
    Eres un agrónomo experto y director de fincas, especializado en la planificación de ciclos de cultivo en Colombia.
    Tu misión es crear un plan de labores detallado y realista para los próximos 12 meses para un lote específico.

    DATOS DEL LOTE:
    - Cultivo: {{{crop}}}
    - Fecha de Siembra: {{{sowingDate}}}
    - Área: {{{areaHectares}}} hectáreas

    INSTRUCCIONES:
    1.  **Ciclo de Cultivo:** Basándote en la fecha de siembra, genera una lista de las labores agronómicas más importantes para un ciclo de 12 meses para el cultivo de '{{{crop}}}'. Incluye fertilizaciones, control de plagas y enfermedades, podas, control de malezas y cosecha(s).
    2.  **Fechas Clave:** Calcula las fechas de inicio ('startDate') para cada labor, tomando la fecha de siembra como punto de partida. Sé lógico con la cronología (e.g., la primera fertilización ocurre X semanas después de la siembra).
    3.  **Estimación de Jornales:** Para cada labor, calcula un número razonable de 'plannedJournals' (jornales) necesarios. Utiliza el área del lote ({{{areaHectares}}} Ha) como factor principal. Por ejemplo, una fertilización en un lote grande requiere más jornales que en uno pequeño. Sé realista.
    4.  **Descripciones Claras:** Usa nombres de labor ('type') específicos y útiles. En 'observations', justifica brevemente la importancia de esa labor en ese momento del ciclo.
    5.  **Formato:** Tu respuesta DEBE ser únicamente el objeto JSON que se adhiere al esquema de salida. No incluyas texto adicional ni explicaciones fuera del JSON.
  `,
});


// Define the Genkit flow
const taskPlannerFlow = ai.defineFlow(
  {
    name: 'taskPlannerFlow',
    inputSchema: TaskPlannerInputSchema,
    outputSchema: TaskPlannerOutputSchema,
  },
  async (input) => {
    const {output} = await taskPlannerPrompt(input);
    if (!output || !output.plannedTasks) {
        throw new Error("The AI planner did not return a valid task plan.");
    }
    return output;
  }
);
