'use server';

/**
 * @fileOverview Identifies the educational level of research subjects in a paper.
 *
 * - classifySubjectLevel - A function that handles the classification process.
 * - ClassifySubjectLevelInput - The input type for the classifySubjectLevel function.
 * - ClassifySubjectLevelOutput - The return type for the classifySubjectLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifySubjectLevelInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifySubjectLevelInput = z.infer<typeof ClassifySubjectLevelInputSchema>;

const SubjectLevelEnum = z.enum([
    'K12', 
    'HigherEd', 
    'Graduate', 
    'DoctoralPlus', 
    'Teacher', 
    'NotApplicable'
]);

const ClassifySubjectLevelOutputSchema = z.object({
  level: SubjectLevelEnum.describe('The identified educational level of the research subjects.'),
  source: z.string().optional().describe('The exact sentence or phrase from the document that justifies the classification.'),
  page: z.number().optional().describe('The page number from which the source was taken.'),
});
export type ClassifySubjectLevelOutput = z.infer<typeof ClassifySubjectLevelOutputSchema>;

export async function classifySubjectLevel(input: ClassifySubjectLevelInput): Promise<ClassifySubjectLevelOutput> {
  return classifySubjectLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifySubjectLevelPrompt',
  input: {schema: ClassifySubjectLevelInputSchema},
  output: {schema: ClassifySubjectLevelOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the educational level of the research subjects in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Choose only one category from the following:
- "K12": subjects who are in or have completed elementary, middle school, or high school.
- "HigherEd": subjects who are in or have completed any post-secondary study (undergraduate + graduate).
- "Graduate": subjects who are in or have completed post-bachelor’s study (Master’s, PhD, professional programs).
- "DoctoralPlus": subjects who have completed postgraduate training, but not a formal degree.
- "Teacher": subjects who are teachers (use this if the paper only says “teachers” without specifying their education level).
- "NotApplicable": if the research does not involve human subjects or their educational level is not mentioned.

Respond with the category name in the 'level' field.
Also, provide the exact sentence or phrase from the document that justifies your classification in the 'source' field, and the page number in the 'page' field. If the level is "NotApplicable", the source and page can be empty.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifySubjectLevelFlow = ai.defineFlow(
  {
    name: 'classifySubjectLevelFlow',
    inputSchema: ClassifySubjectLevelInputSchema,
    outputSchema: ClassifySubjectLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
