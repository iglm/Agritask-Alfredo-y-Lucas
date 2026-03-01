'use server';
/**
 * @fileOverview An agricultural planning AI agent.
 *
 * - generateTaskPlan - A function that creates a 12-month work plan for a specific lot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { cultivationPlans } from '@/ai/knowledge/agronomic-plans';

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
  knowledgeBase: z.string().describe("The expert agronomic knowledge base as a JSON string. This is the primary source of truth."),
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
export async function generateTaskPlan(
    input: Omit<TaskPlannerInput, 'knowledgeBase'>
): Promise<TaskPlannerOutput> {
    const cropKey = input.crop.toLowerCase() as keyof typeof cultivationPlans;
    const plan = cultivationPlans[cropKey] || cultivationPlans.default;

    if (!plan) {
        throw new Error(`No se encontró un plan agronómico para el cultivo: ${input.crop}`);
    }

    return taskPlannerFlow({
        ...input,
        knowledgeBase: JSON.stringify(plan),
    });
}


// Define the AI prompt for task planning
const taskPlannerPrompt = ai.definePrompt({
  name: 'taskPlannerPrompt',
  input: {schema: TaskPlannerInputSchema},
  output: {schema: TaskPlannerOutputSchema},
  prompt: `
    You are an AI assistant that adapts a pre-defined, expert agronomic plan to a user's specific lot.

    STRICT INSTRUCTIONS:
    1.  Your response MUST be a valid JSON object that conforms to the specified output schema.
    2.  Your SOLE SOURCE OF TRUTH is the 'knowledgeBase' JSON provided below. Do NOT invent tasks, categories, or observations.
    3.  Your only job is to calculate the 'startDate' for each task and estimate 'plannedJournals'.
    4.  'startDate' Calculation: The 'knowledgeBase' provides a 'timing' (e.g., "week 8"). Calculate the exact date by adding that offset to the user's 'sowingDate'. Assume 1 month = 4 weeks.
    5.  'plannedJournals' Estimation: The 'knowledgeBase' provides a 'baseJournalsPerHa'. You MUST calculate the 'plannedJournals' by multiplying this base value by the user's 'areaHectares'. Round the result to the nearest integer.
    6.  Copy the 'category', 'type', and 'observations' directly from the 'knowledgeBase'. Do not alter them.
    7.  Generate a plan for a full 12-month cycle.

    USER'S LOT DATA:
    -   Crop: {{{crop}}}
    -   Sowing Date: {{{sowingDate}}}
    -   Area: {{{areaHectares}}} hectares

    AGRONOMIC KNOWLEDGE BASE (Primary Source of Truth):
    \`\`\`json
    {{{knowledgeBase}}}
    \`\`\`
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
