'use server';
/**
 * @fileOverview An agricultural data auditing AI agent.
 *
 * - auditData - A function that handles the data auditing process.
 * - DataAuditInput - The input type for the auditData function.
 * - DataAuditOutput - The return type for the auditData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the structure for a single detected audit observation
const AuditObservationSchema = z.object({
  description: z.string().describe("A clear, concise description of the logical inconsistency or observation found in the data."),
  category: z.string().describe("A category for the observation, e.g., 'Planificación a Largo Plazo', 'Gestión de Colaboradores', 'Coherencia de Datos', 'Salud y Seguridad'."),
  suggestion: z.string().describe("A brief, actionable suggestion to resolve the observation."),
  severity: z.enum(["Alta", "Media", "Baja"]).describe("The severity level of the audit observation."),
});

// Define the input schema for the flow
const DataAuditInputSchema = z.object({
  jsonData: z.string().describe("A JSON string containing arrays of 'lots', 'tasks', and 'staff' from the farm management system."),
  currentDate: z.string().describe("Today's date in yyyy-MM-dd format for temporal analysis."),
});
export type DataAuditInput = z.infer<typeof DataAuditInputSchema>;

// Define the output schema for the flow
const DataAuditOutputSchema = z.object({
    observations: z.array(AuditObservationSchema).describe("A list of audit observations. If no issues are found, this will be an empty array.")
});
export type DataAuditOutput = z.infer<typeof DataAuditOutputSchema>;


/**
 * Public function to trigger the data audit flow.
 * @param input The farm data to be audited.
 * @returns A promise that resolves to the list of audit observations.
 */
export async function auditData(input: DataAuditInput): Promise<DataAuditOutput> {
  return dataAuditFlow(input);
}

// Define the AI prompt for data auditing
const dataAuditPrompt = ai.definePrompt({
  name: 'dataAuditPrompt',
  input: {schema: DataAuditInputSchema},
  output: {schema: DataAuditOutputSchema},
  prompt: `
    Eres un auditor de datos y gerente de fincas agrícolas con 20 años de experiencia. Tu misión es analizar los siguientes datos en formato JSON para encontrar inconsistencias lógicas, omisiones y oportunidades de mejora en la gestión. No busques errores financieros, enfócate en la coherencia operativa, la planificación a largo plazo y la seguridad del personal. La fecha actual es {{currentDate}}.

    Tu análisis debe centrarse en:
    1.  **Omisiones en Cosechas:** Identifica lotes cuya fecha de siembra ('sowingDate') sea de hace varios años pero que no tengan labores de 'Cosecha' registradas en el último año. Los cultivos perennes como café o aguacate deberían tener cosechas anuales.
    2.  **Colaboradores Inactivos:** Encuentra colaboradores ('staff') que no han tenido ninguna labor ('tasks') asignada en los últimos 60-90 días. Podrían ser colaboradores inactivos.
    3.  **Planificación Incompleta:** Detecta lotes recién sembrados (últimos 6 meses) que no tengan ninguna labor de 'Mantenimiento' o 'Fertilización' programada para el futuro.
    4.  **Uso de Lotes:** Identifica lotes que existen desde hace mucho tiempo pero no tienen ninguna labor asignada, ni pasada ni futura. ¿Están abandonados?
    5.  **Auditoría de Salud y Seguridad (EPS - ALTA SEVERIDAD):** Revisa todos los colaboradores ('staff') asignados a cualquier tarea ('tasks') en las categorías 'Cosecha' o 'Mantenimiento'. Si uno de estos colaboradores tiene el campo 'eps' vacío o no definido, genera una observación de severidad 'Alta'. La seguridad del personal es crítica.

    Para cada observación, proporciona una descripción clara del problema, una categoría, una sugerencia concreta y breve, y un nivel de severidad. Sé conciso y directo. Si no encuentras nada, devuelve un array vacío.

    Datos a analizar:
    {{{jsonData}}}
  `,
});


// Define the Genkit flow
const dataAuditFlow = ai.defineFlow(
  {
    name: 'dataAuditFlow',
    inputSchema: DataAuditInputSchema,
    outputSchema: DataAuditOutputSchema,
  },
  async (input) => {
    const {output} = await dataAuditPrompt(input);
    return output!;
  }
);
