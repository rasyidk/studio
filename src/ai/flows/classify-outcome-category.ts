'use server';

/**
 * @fileOverview Identifies the outcome category(ies) reported in a research paper.
 *
 * - classifyOutcomeCategory - A function that handles the classification process.
 * - ClassifyOutcomeCategoryInput - The input type for the classifyOutcomeCategory function.
 * - ClassifyOutcomeCategoryOutput - The return type for the classifyOutcomeCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyOutcomeCategoryInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyOutcomeCategoryInput = z.infer<typeof ClassifyOutcomeCategoryInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyOutcomeCategoryOutputSchema = z.object({
  outcomeCategory: z.string().describe('The identified outcome category(ies).'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyOutcomeCategoryOutput = z.infer<typeof ClassifyOutcomeCategoryOutputSchema>;

export async function classifyOutcomeCategory(input: ClassifyOutcomeCategoryInput): Promise<ClassifyOutcomeCategoryOutput> {
  return classifyOutcomeCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyOutcomeCategoryPrompt',
  input: {schema: ClassifyOutcomeCategoryInputSchema},
  output: {schema: ClassifyOutcomeCategoryOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the outcome category(ies) reported in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Content": outcomes related to subject matter knowledge or understanding.
- "Language_Perf": outcomes related to language performance or proficiency.
- "Engagement": outcomes related to learner engagement or participation.
- "Affective": outcomes related to attitudes, motivation, or emotions.
- "Policy_Outputs": outcomes related to institutional or policy-level results.

Rule:
- Respond with only the category names separated by commas if multiple.
- If no outcomes are mentioned, respond with NR.

Respond with the category name(s) in the 'outcomeCategory' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyOutcomeCategoryFlow = ai.defineFlow(
  {
    name: 'classifyOutcomeCategoryFlow',
    inputSchema: ClassifyOutcomeCategoryInputSchema,
    outputSchema: ClassifyOutcomeCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
