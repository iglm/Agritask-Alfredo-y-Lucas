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
  suggestion: z.string().describe("A clear, concise description of the optimization suggestion. For example, 'Reassign task X from Juan to Maria to balance workload.' or 'Alert: 50kg of Urea needed, only 20kg in stock.'"),
  severity: z.enum(["Alta", "Media", "Baja"]).describe("The priority of the suggestion. 'Alta' for critical imbalances or shortages, 'Baja' for minor tweaks."),
  category: z.enum(["Carga de Trabajo", "Planificación", "Inventario"]).describe("The category of the suggestion."),
});

// Define the input schema for the flow
const ResourceOptimizerInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'tasks' (for the upcoming period), 'staff', and 'supplies' from the farm management system."),
  workWeekJournals: z.number().describe("The standard number of work-days (jornales) in a week for a single worker, e.g., 5."),
});
export type ResourceOptimizerInput = z.infer<typeof ResourceOptimizerInputSchema>;

// Define the output schema for the flow
const ResourceOptimizerOutputSchema = z.object({
    suggestions: z.array(OptimizationSuggestionSchema).describe("A list of optimization suggestions. If everything is balanced, this will be an empty array.")
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
    Eres un jefe de operaciones experto en fincas agrícolas, especializado en optimizar la asignación de recursos humanos e inventario. Tu misión es analizar la carga de trabajo y el uso de insumos para el próximo período y proponer acciones para asegurar una operación fluida.

    DATOS A ANALIZAR:
    - Listas de 'staff', 'tasks' programadas, y 'supplies' (insumos).
    - La semana laboral estándar es de {{workWeekJournals}} jornales por colaborador.

    INSTRUCCIONES:
    1.  **Análisis de Carga de Trabajo:**
        - Para cada colaborador, suma los 'plannedJournals' de todas las labores que tiene asignadas.
        - Identifica quiénes están sobrecargados (muy por encima del estándar) y quiénes tienen poca carga (muy por debajo).
        - Si encuentras un desbalance significativo, crea una sugerencia de categoría 'Carga de Trabajo'. La sugerencia debe proponer reasignar una labor específica de una persona sobrecargada a una con poca carga.

    2.  **Análisis de Inventario:**
        - Para cada labor, revisa su propiedad 'plannedSupplies'.
        - Suma las cantidades requeridas ('quantity') de cada insumo único ('supplyId') para todas las labores.
        - Compara este total requerido con el 'currentStock' del insumo correspondiente en la lista de 'supplies'.
        - Si la cantidad requerida es mayor que el stock, genera una sugerencia de categoría 'Inventario' con severidad 'Alta'. Sé específico: "Alerta de stock: Se necesitan [Total Requerido] [Unidad] de [Nombre del Insumo], pero solo hay [Stock Actual] en inventario."

    3.  **Priorizar:** Asigna una severidad 'Alta' a los desbalances críticos y a cualquier faltante de inventario. 'Media' o 'Baja' a los desbalances menores de colaboradores.

    4.  **Si todo está bien:** Si la carga de trabajo está balanceada y el inventario es suficiente, devuelve un array de sugerencias vacío.

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
