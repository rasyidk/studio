'use server';

/**
 * @fileOverview Identifies the types of teacher support provided or mentioned in a research paper.
 *
 * - classifyTeacherSupport - A function that handles the classification process.
 * - ClassifyTeacherSupportInput - The input type for the classifyTeacherSupport function.
 * - ClassifyTeacherSupportOutput - The return type for the classifyTeacherSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyTeacherSupportInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyTeacherSupportInput = z.infer<typeof ClassifyTeacherSupportInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyTeacherSupportOutputSchema = z.object({
  teacherSupport: z.string().describe('The identified types of teacher support.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyTeacherSupportOutput = z.infer<typeof ClassifyTeacherSupportOutputSchema>;

export async function classifyTeacherSupport(input: ClassifyTeacherSupportInput): Promise<ClassifyTeacherSupportOutput> {
  return classifyTeacherSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyTeacherSupportPrompt',
  input: {schema: ClassifyTeacherSupportInputSchema},
  output: {schema: ClassifyTeacherSupportOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the types of teacher support provided or mentioned in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Explicit_Scaffolding": Teachers are given clear guidance or structured support on how to integrate AI.
- "TPD_DigLit": Teachers receive training or professional development in digital literacy or AI use.
- "Support_Centers": Teachers have access to support centers, helpdesks, or additional resources.

Rule:
- Respond with only the category names separated by commas if multiple.
- If no teacher support is mentioned, respond with NR.

Respond with the category name(s) in the 'teacherSupport' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyTeacherSupportFlow = ai.defineFlow(
  {
    name: 'classifyTeacherSupportFlow',
    inputSchema: ClassifyTeacherSupportInputSchema,
    outputSchema: ClassifyTeacherSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
