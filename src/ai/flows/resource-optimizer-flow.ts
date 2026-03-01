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
            type: z.enum(['reassignTask']),
            payload: ReassignTaskPayloadSchema,
        }),
        z.object({
            type: z.enum(['createPurchaseOrder']),
            payload: CreatePurchaseOrderPayloadSchema,
        }),
        z.object({
            type: z.enum(['informational']),
            payload: z.object({
                details: z.string().optional().describe("Any extra detail for the informational suggestion.")
            }),
        })
    ]).describe("The specific, machine-readable action to be taken.")
});


// Define the input schema for the flow
const ResourceOptimizerInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'tasks' (for the upcoming period), 'staff', and 'supplies' from the farm management system. Tasks may include 'downtimeMinutes' and a 'plannedSupplies' array."),
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
    You are an expert operations manager AI for agricultural farms, specializing in resource allocation and operational efficiency.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Do NOT include any text, commentary, or explanations outside of the JSON structure.
    3.  Your mission is to analyze workload, inventory, and downtime to propose structured, executable actions in JSON format.
    4.  If workload is balanced and inventory is sufficient, you MUST return an object with an empty "suggestions" array.
    
    DATA TO ANALYZE:
    -   JSON data containing 'staff', scheduled 'tasks', and 'supplies'.
    -   The standard work week is {{workWeekJournals}} man-days (jornales) per collaborator.

    KEY INSTRUCTIONS:
    -   **Workload Analysis (Action: \`reassignTask\`):**
        -   Sum the \`plannedJournals\` for tasks assigned to each collaborator.
        -   If a significant imbalance is found, generate a \`reassignTask\` action with 'Baja' severity.
        -   **Required Payload:** \`taskId\`, \`fromStaffId\` (overloaded), \`toStaffId\` (available).
        -   **\`explanation\`:** Must be clear. E.g., "Reassign 'Poda de Crecimiento' task from Juan Pérez (overloaded) to María López (available) to balance workload."

    -   **Inventory Analysis (Action: \`createPurchaseOrder\`):**
        -   Sum the \`quantity\` for each unique \`supplyId\` in the \`plannedSupplies\` property of all tasks.
        -   Compare the required total with the supply's \`currentStock\`.
        -   If stock is insufficient, generate a \`createPurchaseOrder\` action with 'Alta' severity.
        -   **Required Payload:** \`supplyId\`, \`supplyName\`, \`requiredQuantity\`, \`currentStock\`.
        -   **\`explanation\`:** Be specific. E.g., "Alerta de Stock: Se necesitan 150 Kg de Abono 15-15-15, pero solo hay 50 Kg en inventario."

    -   **Downtime Analysis (Action: \`informational\`):**
        -   Analyze the \`downtimeMinutes\` field in tasks. Look for patterns: if a specific task type (e.g., 'Fumigación') or a collaborator consistently accumulates significant downtime.
        -   If a pattern is found, generate an informational suggestion with 'Media' severity.
        -   **Required Payload:** \`details\` with a message like "Se detectó un tiempo muerto promedio de 60 minutos en labores de 'Fumigación'. Sugerencia: Revisar logística de preparación de mezclas o estado de equipos para mejorar eficiencia."
        -   **\`explanation\`:** "Patrón de tiempo muerto detectado en labores de Fumigación. Se sugiere revisión logística."

    -   **Cost Deviation Analysis (Action: \`informational\`):**
        -   Compare the \`actualCost\` with the \`plannedCost\` of completed tasks.
        -   If a deviation over 20% is found in a finished task, generate an informational suggestion with 'Media' severity.
        -   **Required Payload:** \`details\` with a message like "La labor '...' tuvo un sobrecosto del X%. Analizar si fue por jornales extra o gastos no planeados en insumos."
    
    Data to analyze:
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
