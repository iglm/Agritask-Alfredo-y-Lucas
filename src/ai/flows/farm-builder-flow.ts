'use server';
/**
 * @fileOverview An AI agent that constructs an entire farm's data structure from a natural language description.
 *
 * - buildFarmFromDescription - Translates a high-level description into a structured, multi-entity creation plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { employmentTypes, Task, supplyUnits } from '@/lib/types';
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

const SupplyCreateSchema = z.object({
  name: z.string().describe("El nombre del insumo, ej: 'Urea', 'Glifosato'."),
  unitOfMeasure: z.enum(supplyUnits).describe("La unidad de medida. Si no se especifica, inferir la más común para ese tipo de insumo (ej: 'Bulto' para fertilizantes)."),
  costPerUnit: z.number().describe("El costo por unidad del insumo, si se especifica."),
});


// The final output schema for the entire plan
const FarmPlanSchema = z.object({
    summary: z.string().describe("Un resumen conciso y conversacional de las acciones que la IA va a ejecutar. Ej: 'Entendido, crearé la finca La Esperanza con 10 lotes, 20 trabajadores y el insumo Urea.'"),
    productiveUnit: ProductiveUnitCreateSchema.optional().describe("La finca principal a crear. Solo se crea si no hay una 'existingUnit'."),
    lots: z.array(LotCreateSchema).optional().describe("Una lista de lotes a crear dentro de la finca."),
    staff: z.array(StaffCreateSchema).optional().describe("Una lista de colaboradores a registrar."),
    tasks: z.array(TaskCreateSchema).optional().describe("A list of standard agronomic tasks to create for the new productive lots."),
    supplies: z.array(SupplyCreateSchema).optional().describe("Una lista de insumos a crear si el usuario los menciona."),
});


// Input schema for the flow
const FarmBuilderInputSchema = z.object({
  description: z.string().describe("La descripción en lenguaje natural que proporciona el usuario."),
  currentDate: z.string().describe("La fecha actual en formato YYYY-MM-DD para resolver fechas relativas."),
  existingUnit: z.object({
    id: z.string(),
    farmName: z.string(),
  }).optional().describe("Información de la unidad productiva existente, si la hay."),
});

export type FarmBuilderInput = z.infer<typeof FarmBuilderInputSchema>;
export type FarmBuilderOutput = z.infer<typeof FarmPlanSchema>;

export async function buildFarmFromDescription(input: Omit<FarmBuilderInput, 'currentDate'>): Promise<FarmBuilderOutput> {
    const today = new Date();
    const contextWithDate = {
        ...input,
        currentDate: today.toISOString().split('T')[0],
    };
  return farmBuilderFlow(contextWithDate);
}

const farmBuilderPrompt = ai.definePrompt({
  name: 'farmBuilderPrompt',
  input: { schema: FarmBuilderInputSchema },
  output: { schema: FarmPlanSchema },
  prompt: `
    You are a world-class agricultural operations architect AI. Your mission is to act as a strategic partner, transforming a user's high-level description into a comprehensive, actionable, and intelligent farm setup plan in JSON format.

    **CORE DIRECTIVE: Be Proactive and Intelligent. Your goal is to save the user work.**

    1.  **Analyze the User's Request:**
        *   **Entities:** Extract every entity mentioned: Finca (Productive Unit), Lotes, Personal (Staff), and also any specific **Insumos (Supplies)** like 'Urea', 'glifosato', etc.
        *   **Context:** Check if an 'existingUnit' is provided. If so, you are ADDING to an existing farm. If not, you are CREATING a new one. Your 'summary' and plan must reflect this.

    2.  **Generate a Comprehensive Plan (This is your main task):**
        *   **Productive Unit:** Create one if it doesn't exist.
        *   **Lots & Staff:** Create the number of lots and staff requested. Generate sensible names if not provided.
        *   **PROACTIVE STAFF CREATION (VERY IMPORTANT):** If the user describes a significant operation (e.g., creates multiple lots or a large total area) but does not mention creating staff, you MUST create a reasonable number of 'Colaborador' entities to perform the work. A good rule of thumb is 1 collaborator per 10 hectares. You MUST mention this proactive action in your 'summary', for example: "Como no especificaste trabajadores, he tomado la iniciativa de añadir 5 colaboradores para manejar la operación."
        *   **SUPPLIES:** If the user mentions any supplies, add them to the 'supplies' array in your plan. Infer the 'unitOfMeasure' and a typical 'costPerUnit' if not provided (e.g., Urea is often in 'Bulto' and costs around 90000).
        *   **INTELLIGENT TASK GENERATION:** Do not just create what the user explicitly asks for. You MUST create a full, logical 12-month agronomic plan for any productive lots.
            *   Use the **Agronomic Knowledge Base** provided below to generate a standard set of tasks.
            *   Calculate the 'startDate' for each task based on the lot's 'sowingDate' and the 'timing' from the knowledge base. The current date is {{currentDate}}.
            *   Calculate the 'plannedJournals' for each task by multiplying the 'baseJournalsPerHa' from the knowledge base by the lot's 'areaHectares'.
            *   Also include any **explicitly requested recurring tasks** (e.g., "guadaña cada 2 meses").
            *   The 'lotName' in each task MUST match the name of a lot you are creating in the same plan.

    3.  **Provide a Conversational Summary:**
        *   Your 'summary' is crucial. It's your chance to act as a partner.
        *   Example: "¡Entendido! Estoy diseñando la finca 'La Esmeralda'. He creado 8 lotes de café y 10 colaboradores. Más importante aún, he generado un plan agronómico inicial de 12 meses para tus lotes de café, incluyendo fertilizaciones y control de broca. También vi que mencionaste 'Urea', así que lo añadí a tu lista de insumos. ¿Procedemos con la construcción?"

    **AGRONOMIC KNOWLEDGE BASE (Use this to create the 'tasks'):**
    \`\`\`json
    ${JSON.stringify(cultivationPlans)}
    \`\`\`

    **USER DESCRIPTION:**
    "{{description}}"

    **EXISTING FARM CONTEXT:**
    {{#if existingUnit}}
    -   **Finca Actual:** {{existingUnit.farmName}} (ID: {{existingUnit.id}})
    -   **Modo:** Añadir nuevas entidades.
    {{else}}
    -   **Finca Actual:** Ninguna.
    -   **Modo:** Creación inicial de finca.
    {{/if}}
  `,
});


const farmBuilderFlow = ai.defineFlow(
  {
    name: 'farmBuilderFlow',
    inputSchema: FarmBuilderInputSchema,
    outputSchema: FarmPlanSchema,
  },
  async (input) => {
    // Call the prompt.
    const { output: comprehensivePlan } = await farmBuilderPrompt(input);
    if (!comprehensivePlan) {
      throw new Error("El Constructor IA no pudo generar un plan válido.");
    }
    
    // No more brittle date fixing. We trust the AI to follow the prompt's schema.
    return comprehensivePlan;
  }
);
