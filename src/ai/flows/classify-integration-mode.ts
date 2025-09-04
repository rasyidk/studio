'use server';

/**
 * @fileOverview Identifies the mode of AI integration in a research paper.
 *
 * - classifyIntegrationMode - A function that handles the classification process.
 * - ClassifyIntegrationModeInput - The input type for the classifyIntegrationMode function.
 * - ClassifyIntegrationModeOutput - The return type for the classifyIntegrationMode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyIntegrationModeInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyIntegrationModeInput = z.infer<typeof ClassifyIntegrationModeInputSchema>;

const IntegrationModeEnum = z.enum([
    'Taught_Required',
    'Allowed_Disclosure',
    'Semi_Controlled',
    'Restricted',
    'NR'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyIntegrationModeOutputSchema = z.object({
  integrationMode: IntegrationModeEnum.describe('The identified mode of AI integration in the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyIntegrationModeOutput = z.infer<typeof ClassifyIntegrationModeOutputSchema>;

export async function classifyIntegrationMode(input: ClassifyIntegrationModeInput): Promise<ClassifyIntegrationModeOutput> {
  return classifyIntegrationModeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyIntegrationModePrompt',
  input: {schema: ClassifyIntegrationModeInputSchema},
  output: {schema: ClassifyIntegrationModeOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the mode of AI integration in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Taught_Required": AI use is required and directly taught as part of the course.
- "Allowed_Disclosure": AI use is allowed, and students may disclose it.
- "Semi_Controlled": AI use is partially controlled or guided by the instructor.
- "Restricted": AI use is restricted or limited in the learning context.
- "NR": Not reported / no information provided.

Choose only one category from the list above.
Respond with the category name in the 'integrationMode' field.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyIntegrationModeFlow = ai.defineFlow(
  {
    name: 'classifyIntegrationModeFlow',
    inputSchema: ClassifyIntegrationModeInputSchema,
    outputSchema: ClassifyIntegrationModeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
