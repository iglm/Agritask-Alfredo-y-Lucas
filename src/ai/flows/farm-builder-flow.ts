'use server';
/**
 * @fileOverview An AI agent that constructs an entire farm's data structure from a natural language description.
 *
 * - buildFarmFromDescription - Translates a high-level description into a structured, multi-entity creation plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { employmentTypes, Task } from '@/lib/types';
import { subMonths, format, addWeeks } from 'date-fns';
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
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas."),
});

export type FarmBuilderInput = z.infer<typeof FarmBuilderInputSchema>;
export type FarmBuilderOutput = z.infer<typeof FarmPlanSchema>;

export async function buildFarmFromDescription(input: Pick<FarmBuilderInput, 'description'>): Promise<FarmBuilderOutput> {
    const today = new Date();
    const contextWithDate = {
        ...input,
        currentDate: today.toISOString().split('T')[0],
    };
  return farmBuilderFlow(contextWithDate);
}

// This prompt is now much simpler. It only extracts entities and user-defined recurring tasks.
const farmEntityExtractionPrompt = ai.definePrompt({
  name: 'farmEntityExtractionPrompt',
  input: { schema: FarmBuilderInputSchema },
  // The output schema is the same, but we only expect it to fill in units, lots, staff, and user-defined tasks.
  output: { schema: FarmPlanSchema },
  prompt: `
    You are an agricultural data architect. Your purpose is to translate a user's description of their farm into a structured JSON plan.

    **CRITICAL DIRECTIVES:**
    1.  **Output:** Your output MUST be a single, valid JSON object that strictly adheres to the 'FarmPlanSchema'.
    2.  **Entity Extraction:** Parse the user's description to create ONE 'productiveUnit', and OPTIONALLY, arrays of 'lots' and 'staff'.
    3.  **Task Extraction:** Parse the user's description for **explicit recurring tasks only** (e.g., "3 fertilizaciones al año", "guadañada cada 2 meses"). You MUST create these as tasks in the 'tasks' array. For "3 al año", infer an interval of 4 and a frequency of 'meses'. The startDate should be a sensible date after the lot's sowingDate, if provided. The task's 'lotName' must match a lot being created. **DO NOT invent tasks that are not explicitly mentioned by the user.**
    4.  **Calculations & Logic:**
        *   Calculate the area for each lot if a total area and number of lots are given.
        *   Create a default farm name if not provided.
        *   If a relative sowing date is given (e.g., "10 meses de sembrado"), you MUST calculate the exact date based on 'currentDate' ({{currentDate}}) and format it as 'YYYY-MM-DD'.
        *   Generate descriptive names for lots and staff if not provided.
    5.  **Defaults:** Use a default 'baseDailyRate' of 45000 for staff if not specified. Default 'employmentType' is 'Temporal'.
    6.  **Safety Rails:** Limit generation to 25 lots and 25 staff members.
    7.  **Summary:** The 'summary' field MUST be a brief, conversational confirmation of the basic entities you are creating. Example: "Entendido. Voy a crear la finca, X lotes y Y trabajadores."

    **USER DESCRIPTION:**
    "{{description}}"
  `,
});


const farmBuilderFlow = ai.defineFlow(
  {
    name: 'farmBuilderFlow',
    inputSchema: FarmBuilderInputSchema,
    outputSchema: FarmPlanSchema,
  },
  async (input) => {
    // Step 1: AI call to get the basic structure (units, lots, staff, user-defined tasks).
    const { output: initialPlan } = await farmEntityExtractionPrompt(input);
    if (!initialPlan) {
      throw new Error("El Constructor IA no pudo generar un plan inicial válido.");
    }
    
    let standardTasksGenerated = false;

    // Step 2: Programmatically enhance the plan with standard agronomic tasks.
    if (initialPlan.lots) {
        const generatedTasks: z.infer<typeof TaskCreateSchema>[] = [];
        
        for (const lot of initialPlan.lots) {
            if (lot.crop && lot.sowingDate) {
                const cropKey = lot.crop.toLowerCase() as keyof typeof cultivationPlans;
                const standardPlan = cultivationPlans[cropKey] || cultivationPlans['default'];

                if (standardPlan && standardPlan.plan) {
                    standardTasksGenerated = true;
                    standardPlan.plan.forEach(taskTemplate => {
                        const timingValue = parseInt(taskTemplate.timing.split(' ')[1]);
                        const baseDate = new Date(lot.sowingDate!.replace(/-/g, '/'));
                        
                        // Assumes timing is in weeks for now, as per the knowledge base structure
                        const startDate = addWeeks(baseDate, timingValue);
                        
                        const plannedJournals = Math.round(taskTemplate.baseJournalsPerHa * lot.areaHectares);

                        generatedTasks.push({
                            lotName: lot.name,
                            category: taskTemplate.category as Task['category'],
                            type: taskTemplate.type,
                            startDate: format(startDate, 'yyyy-MM-dd'),
                            plannedJournals: plannedJournals > 0 ? plannedJournals : 1,
                            observations: taskTemplate.observations,
                        });
                    });
                }
            }
        }
        
        if (generatedTasks.length > 0) {
            if (!initialPlan.tasks) {
                initialPlan.tasks = [];
            }
            initialPlan.tasks.push(...generatedTasks);
        }
    }
    
    // Step 3: Update summary message.
    if (standardTasksGenerated) {
        initialPlan.summary += " Además, generaré el plan de labores estándar para los lotes de cultivo.";
    }

    // Step 4: Final date fixing (keeping the original robust logic).
    if (initialPlan.lots) {
        initialPlan.lots.forEach(lot => {
            if (lot.sowingDate && lot.sowingDate.includes('meses')) {
                const monthsAgo = parseInt(lot.sowingDate.split(' ')[0]);
                if (!isNaN(monthsAgo)) {
                    lot.sowingDate = format(subMonths(new Date(input.currentDate), monthsAgo), 'yyyy-MM-dd');
                }
            }
        });
    }

    return initialPlan;
  }
);
