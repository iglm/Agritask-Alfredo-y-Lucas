'use server';
/**
 * @fileOverview A resource optimization AI agent.
 *
 * - optimizeResources - A function that analyzes workload and suggests optimizations.
 * - ResourceOptimizerInput - The input type for the optimizeResources function.
 * - ResourceOptimizerOutput - The return type for the optimizeResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the structure for a single optimization suggestion
const OptimizationSuggestionSchema = z.object({
  suggestion: z.string().describe("A clear, concise description of the optimization suggestion. For example, 'Reassign task X from Juan to Maria to balance workload.'"),
  severity: z.enum(["Alta", "Media", "Baja"]).describe("The priority of the suggestion. 'Alta' for critical imbalances, 'Baja' for minor tweaks."),
  category: z.enum(["Carga de Trabajo", "Planificación"]).describe("The category of the suggestion."),
});

// Define the input schema for the flow
const ResourceOptimizerInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'tasks' (for the upcoming period) and 'staff' from the farm management system."),
  workWeekJournals: z.number().describe("The standard number of work-days (jornales) in a week for a single worker, e.g., 5."),
});
export type ResourceOptimizerInput = z.infer<typeof ResourceOptimizerInputSchema>;

// Define the output schema for the flow
const ResourceOptimizerOutputSchema = z.object({
    suggestions: z.array(OptimizationSuggestionSchema).describe("A list of optimization suggestions. If the workload is balanced, this will be an empty array.")
});
export type ResourceOptimizerOutput = z.infer<typeof ResourceOptimizerOutputSchema>;


/**
 * Public function to trigger the resource optimization flow.
 * @param input The farm data to be analyzed.
 * @returns A promise that resolves to the list of suggestions.
 */
export async function optimizeResources(input: ResourceOptimizerInput): Promise<ResourceOptimizerOutput> {
  return resourceOptimizerFlow(input);
}

// Define the AI prompt for resource optimization
const optimizerPrompt = ai.definePrompt({
  name: 'optimizerPrompt',
  input: {schema: ResourceOptimizerInputSchema},
  output: {schema: ResourceOptimizerOutputSchema},
  prompt: `
    Eres un jefe de operaciones experto en fincas agrícolas, especializado en optimizar la asignación de recursos humanos. Tu misión es analizar la carga de trabajo del personal para el próximo período y proponer reasignaciones para balancear el trabajo.

    DATOS A ANALIZAR:
    - La semana laboral estándar es de {{workWeekJournals}} jornales por trabajador.
    - Lista de personal ('staff') con sus nombres.
    - Lista de labores ('tasks') programadas, incluyendo 'plannedJournals' y el 'responsibleId'.

    INSTRUCCIONES:
    1.  **Calcular Carga de Trabajo:** Para cada miembro del personal, suma los 'plannedJournals' de todas las labores que tiene asignadas.
    2.  **Identificar Desbalances:** Compara la carga de trabajo de cada persona con la semana laboral estándar ({{workWeekJournals}} jornales). Identifica quiénes están sobrecargados (muy por encima del estándar) y quiénes tienen poca carga (muy por debajo).
    3.  **Proponer Reasignaciones:** Si encuentras un desbalance significativo, crea una sugerencia. La sugerencia debe proponer reasignar una labor específica de una persona sobrecargada a una con poca carga. Sé específico: "Reasignar la labor '[nombre de la labor]' de '[persona sobrecargada]' a '[persona con poca carga]' para balancear el trabajo."
    4.  **Priorizar:** Asigna una severidad 'Alta' a los desbalances críticos (alguien con el doble de trabajo y otro con casi nada) y 'Media' o 'Baja' a los desbalances menores.
    5.  **Si todo está bien:** Si la carga de trabajo está razonablemente balanceada, devuelve un array de sugerencias vacío. No inventes problemas.

    Datos a analizar:
    {{{jsonData}}}
  `,
});


// Define the Genkit flow
const resourceOptimizerFlow = ai.defineFlow(
  {
    name: 'resourceOptimizerFlow',
    inputSchema: ResourceOptimizerInputSchema,
    outputSchema: ResourceOptimizerOutputSchema,
  },
  async (input) => {
    const {output} = await optimizerPrompt(input);
    if (!output) {
      throw new Error("The AI optimizer did not return a valid suggestion set.");
    }
    return output;
  }
);
