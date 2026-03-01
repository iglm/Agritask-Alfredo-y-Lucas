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
    You are an expert agronomist AI and farm director, specializing in crop cycle planning in Colombia for coffee and plantain.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Do NOT include any text, commentary, or explanations outside of the JSON structure.
    3.  Your mission is to create a detailed and realistic 12-month task plan for a specific lot, acting as a 'Predictive Agronomist'.
    4.  Generate a logical list of agronomic tasks based on the sowing date and crop type.

    LOT DATA:
    -   Crop: {{{crop}}}
    -   Sowing Date: {{{sowingDate}}}
    -   Area: {{{areaHectares}}} hectares

    KEY INSTRUCTIONS:
    -   **Crop-Specific Cycle:** Based on the sowing date, generate the most important agronomic tasks for a 12-month cycle for the '{{{crop}}}' crop.
        *   **For Coffee:** Include fertilizations (e.g., NPK edaphic, foliar), pest control (Broca, Roya), weed control, and the main and "mitaca" harvest seasons.
        *   **For Plantain/Banana:** Include leaf pruning, sucker removal, fruit thinning, bagging, fertilization, and Sigatoka control.
    -   **Predictive Start Dates:** Calculate logical and chronological 'startDate' for each task, using the sowing date as the starting point. For example, the first fertilization of a new coffee lot occurs X weeks after sowing; pest control intensifies at certain times. Be precise.
    -   **Realistic Man-Day Estimation:** For each task, calculate a reasonable number of 'plannedJournals'. Use the lot area ({{{areaHectares}}} Ha) as the main factor. A fertilization in 5 hectares requires more man-days than in 0.5 hectares. Use your expertise to provide a credible estimate.
        *   Example reasoning: "To fertilize 1 hectare of coffee, a worker yields about 0.5 hectares per day, so I need 2 man-days". If the lot is 3 Ha, that would be 6 man-days.
    -   **Clear Descriptions:** Use specific and useful task names ('type') (e.g., "First Growth Fertilization (20-10-10)"). In 'observations', briefly justify the agronomic importance of that task at that specific time in the cycle (e.g., "Key nitrogen supply for initial vegetative development").
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
