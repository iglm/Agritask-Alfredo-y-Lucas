import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Initializes and configures the Genkit AI instance.
 *
 * This configuration employs a cost-optimization strategy by default.
 *
 * Model Selection: `gemini-2.5-flash`
 * - This model is chosen as the default for its excellent balance of performance,
 *   speed, and cost-effectiveness. It is suitable for the majority of the app's
 *   AI tasks, including command dispatching and data analysis, providing near-instant
 *   responses while keeping API usage costs low.
 *
 * - For more complex, one-off tasks like the 'Constructor IA' (`farm-builder-flow`),
 *   this model is still powerful enough to handle the complex JSON generation,
 *   providing immense value by automating hours of manual data entry for a minimal
 *   per-use cost.
 */
export const ai = genkit({
  plugins: [
    googleAI(), // Integrates with Google's Gemini models.
  ],
  // We use gemini-2.5-flash as the default for all flows.
  model: 'googleai/gemini-2.5-flash',
});
