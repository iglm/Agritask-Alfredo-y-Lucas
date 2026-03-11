'use server';
/**
 * @fileOverview An agricultural planning AI agent.
 *
 * - generateTaskPlan - A function that creates a 12-month work plan for a specific lot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { cultivationPlans } from '@/ai/knowledge/agronomic-plans';
import { addWeeks, format, parseISO } from 'date-fns';

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
export async function generateTaskPlan(
    input: TaskPlannerInput
): Promise<TaskPlannerOutput> {
    
    // This flow is now deterministic and doesn't need an LLM call.
    const cropKey = input.crop.toLowerCase() as keyof typeof cultivationPlans;
    const standardPlan = cultivationPlans[cropKey] || cultivationPlans.default;

    if (!standardPlan || !standardPlan.plan) {
        throw new Error(`No se encontró un plan agronómico para el cultivo: ${input.crop}`);
    }

    const plannedTasks = standardPlan.plan.map(taskTemplate => {
        const timingValue = parseInt(taskTemplate.timing.split(' ')[1]);
        const baseDate = parseISO(input.sowingDate);
        
        // Assumes timing is in weeks
        const startDate = addWeeks(baseDate, timingValue);
        
        const plannedJournals = Math.round(taskTemplate.baseJournalsPerHa * input.areaHectares);

        return {
            category: taskTemplate.category as TaskPlannerOutput['plannedTasks'][0]['category'],
            type: taskTemplate.type,
            startDate: format(startDate, 'yyyy-MM-dd'),
            plannedJournals: plannedJournals > 0 ? plannedJournals : 1,
            observations: taskTemplate.observations,
        };
    });

    return { plannedTasks };
}
