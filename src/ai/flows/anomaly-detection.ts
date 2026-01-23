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
  taskData: z.string().describe('Cadena JSON que contiene datos de las labores, incluyendo costos planificados vs. reales, progreso y fechas límite.'),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  anomalies: z.array(
    z.object({
      taskId: z.string().optional(),
      description: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
    })
  ).describe('Array de anomalías detectadas, cada una incluyendo una descripción y un nivel de severidad.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return detectAnomaliesFlow(input);
}

const detectAnomaliesPrompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `Eres un asistente de IA diseñado para detectar anomalías en los datos de labores agrícolas.

  Analiza los datos de las labores proporcionados para identificar posibles problemas como retrasos, sobrecostos o ineficiencias. Proporciona un análisis detallado de cualquier anomalía detectada, incluyendo una descripción y un nivel de severidad.

  Datos de las Labores:
  {{taskData}}

  Basado en los datos de las labores, identifica y describe cualquier anomalía.
  Devuelve las anomalías en el siguiente formato JSON:
  {
    "anomalies": [
      {
        "taskId": "task_id_aqui",
        "description": "Descripción de la anomalía",
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
      throw new Error(`JSON de taskData inválido: ${e.message}`);
    }
    const {output} = await detectAnomaliesPrompt(input);
    return output!;
  }
);
