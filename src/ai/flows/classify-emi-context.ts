'use server';

/**
 * @fileOverview Identifies the EMI (English as a Medium of Instruction) context in a research paper.
 *
 * - classifyEmiContext - A function that handles the classification process.
 * - ClassifyEmiContextInput - The input type for the classifyEmiContext function.
 * - ClassifyEmiContextOutput - The return type for the classifyEmiContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyEmiContextInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyEmiContextInput = z.infer<typeof ClassifyEmiContextInputSchema>;

const EmiContextEnum = z.enum([
    'EFL',
    'ESL',
    'Mixed',
    'Others'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyEmiContextOutputSchema = z.object({
  emiContext: EmiContextEnum.describe('The identified EMI context of the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyEmiContextOutput = z.infer<typeof ClassifyEmiContextOutputSchema>;

export async function classifyEmiContext(input: ClassifyEmiContextInput): Promise<ClassifyEmiContextOutput> {
  return classifyEmiContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyEmiContextPrompt',
  input: {schema: ClassifyEmiContextInputSchema},
  output: {schema: ClassifyEmiContextOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the EMI (English as a Medium of Instruction) context in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "EFL": English as a Foreign Language context.
- "ESL": English as a Second Language context.
- "Mixed": combination of EFL and ESL contexts.
- "Others": any other course/project modality not covered above.

Choose only one category from the list above.
Respond with the category name in the 'emiContext' field.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyEmiContextFlow = ai.defineFlow(
  {
    name: 'classifyEmiContextFlow',
    inputSchema: ClassifyEmiContextInputSchema,
    outputSchema: ClassifyEmiContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
