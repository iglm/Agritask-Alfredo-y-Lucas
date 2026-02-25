'use server';
/**
 * @fileOverview A resource optimization AI agent.
 *
 * - optimizeResources - A function that analyzes workload and suggests optimizations.
 * - ResourceOptimizerInput - The input type for the optimizeResources function.
 * - ResourceOptimizerOutput - The return type for the optimizeResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define schemas for the specific action payloads
const ReassignTaskPayloadSchema = z.object({
  taskId: z.string().describe("The ID of the task to be reassigned."),
  fromStaffId: z.string().describe("The ID of the currently assigned, overloaded collaborator."),
  toStaffId: z.string().describe("The ID of the collaborator to whom the task should be reassigned."),
});

const CreatePurchaseOrderPayloadSchema = z.object({
  supplyId: z.string().describe("The ID of the supply that is out of stock."),
  supplyName: z.string().describe("The name of the supply."),
  requiredQuantity: z.number().describe("The total quantity of the supply needed."),
  currentStock: z.number().describe("The current stock of the supply."),
});

// Define the structure for a single, actionable optimization suggestion
const OptimizationSuggestionSchema = z.object({
    explanation: z.string().describe("A clear, human-readable description of the optimization suggestion. For example, 'Reassign task X from Juan to Maria to balance workload.' or 'Alert: 50kg of Urea needed, only 20kg in stock.'"),
    severity: z.enum(["Alta", "Media", "Baja"]).describe("The priority of the suggestion. 'Alta' for critical imbalances or shortages, 'Baja' for minor tweaks."),
    action: z.union([
        z.object({
            type: z.literal('reassignTask'),
            payload: ReassignTaskPayloadSchema,
        }),
        z.object({
            type: z.literal('createPurchaseOrder'),
            payload: CreatePurchaseOrderPayloadSchema,
        }),
        z.object({
            type: z.literal('informational'),
            payload: z.object({
                details: z.string().optional().describe("Any extra detail for the informational suggestion.")
            }),
        })
    ]).describe("The specific, machine-readable action to be taken.")
});


// Define the input schema for the flow
const ResourceOptimizerInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'tasks' (for the upcoming period), 'staff', and 'supplies' from the farm management system."),
  workWeekJournals: z.number().describe("The standard number of work-days (jornales) in a week for a single worker, e.g., 5."),
});
export type ResourceOptimizerInput = z.infer<typeof ResourceOptimizerInputSchema>;

// Define the output schema for the flow
const ResourceOptimizerOutputSchema = z.object({
    suggestions: z.array(OptimizationSuggestionSchema).describe("A list of actionable optimization suggestions. If everything is balanced, this will be an empty array.")
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
    Eres un jefe de operaciones experto en fincas agrícolas, especializado en optimizar la asignación de recursos. Tu misión es analizar la carga de trabajo y el inventario para proponer acciones **estructuradas y ejecutables** en formato JSON.

    DATOS A ANALIZAR:
    - Listas de 'staff', 'tasks' programadas, y 'supplies' (insumos).
    - La semana laboral estándar es de {{workWeekJournals}} jornales por colaborador.

    INSTRUCCIONES CLAVE:
    1.  **Salida Estructurada:** Tu respuesta DEBE ser un array de objetos JSON. Para cada sugerencia, debes determinar el \`action.type\` y rellenar el \`action.payload\` correspondiente.
    2.  **Análisis de Carga de Trabajo (Acción: \`reassignTask\`):**
        -   Suma los \`plannedJournals\` de las labores asignadas a cada colaborador.
        -   Si encuentras un desbalance significativo, genera una acción \`reassignTask\`.
        -   **Payload Requerido:** \`taskId\`, \`fromStaffId\` (el sobrecargado), \`toStaffId\` (el disponible).
        -   **\`explanation\`:** Debe ser clara. Ej: "Reasignar la labor 'Poda de Crecimiento' de Juan Pérez (sobrecargado) a María López (disponible) para balancear la carga."
    3.  **Análisis de Inventario (Acción: \`createPurchaseOrder\`):**
        -   Suma las \`quantity\` de cada \`supplyId\` único en la propiedad \`plannedSupplies\` de todas las labores.
        -   Compara el total requerido con el \`currentStock\` del insumo.
        -   Si el stock es insuficiente, genera una acción \`createPurchaseOrder\` con severidad 'Alta'.
        -   **Payload Requerido:** \`supplyId\`, \`supplyName\`, \`requiredQuantity\`, \`currentStock\`.
        -   **\`explanation\`:** Sé específico. Ej: "Alerta de stock: Se necesitan 150 Kg de Abono 15-15-15, pero solo hay 50 Kg en inventario."
    4.  **Análisis de Desviación de Costos (Acción: \`informational\`):**
        -   Compara el \`actualCost\` con el \`plannedCost\` de las tareas.
        -   Si encuentras una desviación mayor al 15%, genera una sugerencia informativa.
        -   **Payload Requerido:** \`details\` con un mensaje como "La labor '...' tuvo un sobrecosto del X%. Analizar si fue por jornales adicionales o gasto de insumos no planificado."
        -   Esto ayuda a identificar problemas de eficiencia o planificación.
    5.  **Si todo está bien:** Si la carga de trabajo está balanceada y el inventario es suficiente, devuelve un array de sugerencias vacío.

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
