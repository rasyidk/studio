'use server';

/**
 * @fileOverview Identifies the discipline of a research paper.
 *
 * - classifyDiscipline - A function that handles the classification process.
 * - ClassifyDisciplineInput - The input type for the classifyDiscipline function.
 * - ClassifyDisciplineOutput - The return type for the classifyDiscipline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyDisciplineInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyDisciplineInput = z.infer<typeof ClassifyDisciplineInputSchema>;

const DisciplineEnum = z.enum([
    'STEM',
    'Medical',
    'Social Science',
    'Multidisciplinary Studies',
    'Others'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyDisciplineOutputSchema = z.object({
  discipline: DisciplineEnum.describe('The identified discipline of the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyDisciplineOutput = z.infer<typeof ClassifyDisciplineOutputSchema>;

export async function classifyDiscipline(input: ClassifyDisciplineInput): Promise<ClassifyDisciplineOutput> {
  return classifyDisciplineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyDisciplinePrompt',
  input: {schema: ClassifyDisciplineInputSchema},
  output: {schema: ClassifyDisciplineOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the discipline of the research subjects in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Choose only one category from the following:
- "STEM": science, technology, engineering, mathematics
- "Medical": medicine, health, nursing, or healthcare-related fields.
- "Social Science": humanities, social sciences, law, management, or arts.
- "Multidisciplinary Studies": interdisciplinary or mixed fields.
- "Others": does not fit in the above categories.

Respond with the category name in the 'discipline' field.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyDisciplineFlow = ai.defineFlow(
  {
    name: 'classifyDisciplineFlow',
    inputSchema: ClassifyDisciplineInputSchema,
    outputSchema: ClassifyDisciplineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
