'use server';

/**
 * @fileOverview Identifies the sub-discipline of a research paper.
 *
 * - classifySubDiscipline - A function that handles the classification process.
 * - ClassifySubDisciplineInput - The input type for the classifySubDiscipline function.
 * - ClassifySubDisciplineOutput - The return type for the classifySubDiscipline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifySubDisciplineInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifySubDisciplineInput = z.infer<typeof ClassifySubDisciplineInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifySubDisciplineOutputSchema = z.object({
  subDiscipline: z.string().describe('The identified sub-discipline of the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifySubDisciplineOutput = z.infer<typeof ClassifySubDisciplineOutputSchema>;

export async function classifySubDiscipline(input: ClassifySubDisciplineInput): Promise<ClassifySubDisciplineOutput> {
  return classifySubDisciplineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifySubDisciplinePrompt',
  input: {schema: ClassifySubDisciplineInputSchema},
  output: {schema: ClassifySubDisciplineOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the discipline_sub of the research subject in the given paper. Discipline is the main field of the study or subject area that the research participants belong to either they are STEM, Medical, Social Science, Multidisciplinary, or other. Discipline_sub are optional fine labels describing the discipline before such as mechanical, engineering, law, nursing, etc.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Rule : 
if there are multiple research subjects with different discipline_sub separate them with commas.
If there is only 1 discipline_sub you can just say it once. 
if the discipline_sub is not mentioned in the paper you can respond with NR or not reported.
Respond based on the rule given.

Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifySubDisciplineFlow = ai.defineFlow(
  {
    name: 'classifySubDisciplineFlow',
    inputSchema: ClassifySubDisciplineInputSchema,
    outputSchema: ClassifySubDisciplineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
