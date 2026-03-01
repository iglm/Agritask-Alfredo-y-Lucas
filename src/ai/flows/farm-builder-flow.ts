'use server';
/**
 * @fileOverview An AI agent that constructs an entire farm's data structure from a natural language description.
 *
 * - buildFarmFromDescription - Translates a high-level description into a structured, multi-entity creation plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { employmentTypes } from '@/lib/types';
import { subMonths, format } from 'date-fns';
import { cultivationPlans } from '@/ai/knowledge/agronomic-plans';

// Schemas for what can be created. Optional fields are for the AI to infer.
const ProductiveUnitCreateSchema = z.object({
  farmName: z.string().optional().describe("El nombre de la finca o unidad productiva."),
  municipality: z.string().optional().describe("El municipio donde está ubicada."),
  department: z.string().optional().describe("El departamento."),
  totalFarmArea: z.number().optional().describe("El área total de la finca en hectáreas."),
});

const LotCreateSchema = z.object({
  name: z.string().describe("Un nombre descriptivo para el lote, ej: 'Lote 1 - Cafetal Joven'."),
  areaHectares: z.number().describe("El área del lote en hectáreas."),
  crop: z.string().optional().describe("El cultivo principal del lote. Ej: 'Café', 'Plátano'."),
  sowingDate: z.string().optional().describe("La fecha de siembra en formato YYYY-MM-DD."),
});

const StaffCreateSchema = z.object({
  name: z.string().describe("Un nombre ficticio para el colaborador. Ej: 'Colaborador 1', 'Ana Rojas'."),
  baseDailyRate: z.number().describe("El jornal o tarifa diaria a pagar."),
  employmentType: z.enum(employmentTypes).describe("El tipo de empleo, por defecto 'Temporal'."),
  contact: z.string().optional().describe("Número de contacto del colaborador, si se menciona."),
});

const TaskCreateSchema = z.object({
  lotName: z.string().describe("The name of the lot this task belongs to, which must match one of the lots being created in the same plan."),
  category: z.enum(["Preparación", "Siembra", "Mantenimiento", "Cosecha", "Post-Cosecha", "Otro"]),
  type: z.string().describe("Specific name of the task, e.g., 'Primera Fertilización NPK'."),
  startDate: z.string().describe("Suggested start date in YYYY-MM-DD format."),
  plannedJournals: z.number().describe("Estimated man-days for the task."),
  observations: z.string().optional().describe("Agronomic justification for the task."),
  isRecurring: z.boolean().optional().describe("If the task is recurring."),
  recurrenceInterval: z.number().optional().describe("The interval for the recurrence."),
  recurrenceFrequency: z.enum(['días', 'semanas', 'meses']).optional().describe("The frequency of the recurrence."),
});


// The final output schema for the entire plan
const FarmPlanSchema = z.object({
    summary: z.string().describe("Un resumen conciso en lenguaje natural de las acciones que la IA va a ejecutar. Ej: 'Entendido, crearé la finca La Esperanza con 10 lotes y 20 trabajadores.'"),
    productiveUnit: ProductiveUnitCreateSchema.describe("La finca principal a crear. Solo puede haber una."),
    lots: z.array(LotCreateSchema).optional().describe("Una lista de lotes a crear dentro de la finca."),
    staff: z.array(StaffCreateSchema).optional().describe("Una lista de colaboradores a registrar."),
    tasks: z.array(TaskCreateSchema).optional().describe("A list of standard agronomic tasks to create for the new productive lots."),
});


// Input schema for the flow
const FarmBuilderInputSchema = z.object({
  description: z.string().describe("La descripción en lenguaje natural que proporciona el usuario."),
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas como '10 meses de sembrado'."),
  agronomicKnowledgeBase: z.string().describe("A JSON string of standard agronomic plans for various crops."),
});

export type FarmBuilderInput = z.infer<typeof FarmBuilderInputSchema>;
export type FarmBuilderOutput = z.infer<typeof FarmPlanSchema>;

export async function buildFarmFromDescription(input: Pick<FarmBuilderInput, 'description'>): Promise<FarmBuilderOutput> {
    const today = new Date();
    const contextWithDate = {
        ...input,
        currentDate: today.toISOString().split('T')[0],
        agronomicKnowledgeBase: JSON.stringify(cultivationPlans),
    };
  return farmBuilderFlow(contextWithDate);
}

const farmBuilderPrompt = ai.definePrompt({
  name: 'farmBuilderPrompt',
  input: { schema: FarmBuilderInputSchema },
  output: { schema: FarmPlanSchema },
  prompt: `
    You are a hyper-intelligent agricultural data architect. Your purpose is to translate a user's high-level, natural language description of their farm into a structured JSON plan for automatic creation.

    **CRITICAL DIRECTIVES:**
    1.  **Primary Goal:** Your output MUST be a single, valid JSON object that strictly adheres to the 'FarmPlanSchema'.
    2.  **Entity Extraction:** You must parse the user's description to create a plan containing ONE 'productiveUnit', and OPTIONALLY, arrays of 'lots' and 'staff'.
    3.  **Task Generation (VERY IMPORTANT):** 
        *   If the user creates lots with a specific crop (e.g., 'Café', 'Plátano'), you MUST use the provided 'agronomicKnowledgeBase' to automatically generate a standard 12-month task plan for **each** of those new lots. For each task in the knowledge base, you MUST calculate its 'startDate' based on the lot's 'sowingDate' and the task's 'timing' (e.g., "week 8" after sowing). You MUST also calculate 'plannedJournals' by multiplying 'baseJournalsPerHa' by the lot's 'areaHectares'. Copy 'category', 'type', and 'observations' directly. The generated task's 'lotName' must match the name of the lot being created.
        *   If the user's description includes explicit recurring tasks (e.g., "3 fertilizaciones al año", "guadañada cada 2 meses"), you MUST create these as separate recurring tasks for the relevant lots. You should infer the category and calculate the recurrence. For "3 al año", that would be an interval of 4 and a frequency of 'meses'. The startDate should be a sensible date after the lot's sowingDate.
    4.  **Calculations & Logic:**
        *   If the user specifies a total area and a number of lots, you MUST calculate the area for each lot.
        *   If a farm name is not provided, you MUST create a default name.
        *   If the user specifies a relative sowing date (e.g., "10 meses de sembrado"), you MUST calculate the exact date based on the 'currentDate' ({{currentDate}}) and format it as 'YYYY-MM-DD'.
        *   Generate descriptive names for lots and staff if not provided.
    5.  **Defaults:**
        *   If a salary ('jornal') for a worker is not specified, you MUST use a default 'baseDailyRate' of 45000.
        *   For staff, the default 'employmentType' MUST be 'Temporal'.
    6.  **Safety Rails:**
        *   You are STRICTLY FORBIDDEN from generating more than 25 lots or 25 staff members in a single plan. If the request exceeds these limits, inform them in the 'summary' and generate a plan with the maximum allowed.
    7.  **Summary:** The 'summary' field MUST be a brief, conversational confirmation of the plan. You MUST mention if you are adding tasks from the agronomic plan or from the user's description. Example: "Entendido. Voy a crear la finca, X lotes y Y trabajadores. Además, generaré el plan de labores estándar para los lotes y las tareas recurrentes que mencionaste."

    **USER DESCRIPTION:**
    "{{description}}"

    **AGRONOMIC KNOWLEDGE BASE (Source of Truth for Standard Task Generation):**
    \`\`\`json
    {{{agronomicKnowledgeBase}}}
    \`\`\`
  `,
});


const farmBuilderFlow = ai.defineFlow(
  {
    name: 'farmBuilderFlow',
    inputSchema: FarmBuilderInputSchema,
    outputSchema: FarmPlanSchema,
  },
  async (input) => {
    const { output } = await farmBuilderPrompt(input);
    if (!output) {
      throw new Error("El Constructor IA no pudo generar un plan válido.");
    }

    // Post-processing to ensure dates are correct
    if (output.lots) {
        output.lots.forEach(lot => {
            if (lot.sowingDate) {
                // The AI might just say "10 months ago". This logic fixes it.
                // A more robust solution would be to use a tool, but this is a good start.
                if (lot.sowingDate.includes('meses')) {
                    const monthsAgo = parseInt(lot.sowingDate.split(' ')[0]);
                    if (!isNaN(monthsAgo)) {
                        lot.sowingDate = format(subMonths(new Date(input.currentDate), monthsAgo), 'yyyy-MM-dd');
                    }
                }
            }
        });
    }

    return output;
  }
);
