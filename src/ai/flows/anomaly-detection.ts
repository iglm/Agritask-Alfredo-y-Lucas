// anomaly-detection.ts
'use server';

/**
 * @fileOverview An AI-powered anomaly detection tool for task progress data.
 *
 * - detectAnomalies - A function that analyzes task data and flags potential anomalies.
 * - AnomalyDetectionInput - The input type for the detectAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyDetectionInputSchema = z.object({
  taskData: z.string().describe('JSON string containing task data, including planned vs. actual costs, progress, and deadlines.'),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  anomalies: z.array(
    z.object({
      taskId: z.string().optional(),
      description: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
    })
  ).describe('Array of detected anomalies, each including a description and severity level.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return detectAnomaliesFlow(input);
}

const detectAnomaliesPrompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `You are an AI assistant designed to detect anomalies in agricultural task data.

  Analyze the provided task data to identify potential issues such as delays, budget overruns, or inefficiencies. Provide a detailed analysis of any anomalies detected, including a description and severity level.

  Task Data:
  {{taskData}}

  Based on the task data, identify and describe any anomalies.
  Return the anomalies in the following JSON format:
  {
    "anomalies": [
      {
        "taskId": "task_id_here",
        "description": "Description of the anomaly",
        "severity": "high | medium | low"
      }
    ]
  }
  `,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async input => {
    try {
      // Attempt to parse the task data to catch JSON errors before sending to the model.
      JSON.parse(input.taskData);
    } catch (e: any) {
      throw new Error(`Invalid taskData JSON: ${e.message}`);
    }
    const {output} = await detectAnomaliesPrompt(input);
    return output!;
  }
);
