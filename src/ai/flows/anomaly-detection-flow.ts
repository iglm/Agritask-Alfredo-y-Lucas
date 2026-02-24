'use server';
/**
 * @fileOverview An agricultural anomaly detection AI agent.
 *
 * - detectAnomalies - A function that handles the anomaly detection process.
 * - AnomalyDetectionInput - The input type for the detectAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the structure for a single detected anomaly
const AnomalySchema = z.object({
  description: z.string().describe("A clear, concise description of the anomaly or potential issue found in the data."),
  severity: z.enum(["Alto", "Medio", "Bajo"]).describe("The severity level of the detected anomaly."),
  category: z.string().describe("A category for the anomaly, e.g., 'Costos', 'Planificación', 'Rendimiento'."),
});

// Define the input schema for the flow
const AnomalyDetectionInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'lots' and 'tasks' from the farm management system."),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

// Define the output schema for the flow
const AnomalyDetectionOutputSchema = z.object({
    anomalies: z.array(AnomalySchema).describe("A list of detected anomalies. If no anomalies are found, this will be an empty array.")
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;


/**
 * Public function to trigger the anomaly detection flow.
 * @param input The farm data to be analyzed.
 * @returns A promise that resolves to the list of detected anomalies.
 */
export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

// Define the AI prompt for anomaly detection
const anomalyPrompt = ai.definePrompt({
  name: 'anomalyPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `
    Eres un analista de datos experto en gestión agrícola. Tu misión es analizar los siguientes datos de una finca, proporcionados en formato JSON, y detectar únicamente las anomalías, inconsistencias o riesgos más significativos.

    Tu análisis debe centrarse en:
    1.  **Sobre costos:** Labores donde el 'actualCost' (costo real) supera significativamente el 'plannedCost' (costo planificado). Ignora desviaciones menores al 15%.
    2.  **Retrasos Críticos:** Labores importantes ('status' no es 'Finalizado') cuya 'startDate' (fecha de inicio) ya pasó. Presta especial atención a categorías como 'Cosecha' y 'Siembra'.
    3.  **Bajo Progreso:** Labores 'En Proceso' con un 'progress' (progreso) muy bajo en relación al tiempo transcurrido desde su 'startDate'.
    4.  **Concentración de Problemas:** Lotes que acumulan múltiples labores con problemas (retrasadas, sobre costo, etc.).
    5.  **Coherencia de Datos:** Inconsistencias obvias, como una fecha de finalización ('endDate') anterior a la de inicio ('startDate').

    Sé conciso y directo. No inventes problemas si no existen. Si no encuentras anomalías significativas, devuelve un array vacío.

    Datos a analizar:
    {{{jsonData}}}
  `,
});


// Define the Genkit flow
const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async (input) => {
    const {output} = await anomalyPrompt(input);
    return output!;
  }
);
