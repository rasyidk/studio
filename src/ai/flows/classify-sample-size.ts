'use server';

/**
 * @fileOverview Identifies the sample size of research participants.
 *
 * - classifySampleSize - A function that handles the classification process.
 * - ClassifySampleSizeInput - The input type for the classifySampleSize function.
 * - ClassifySampleSizeOutput - The return type for the classifySampleSize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifySampleSizeInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifySampleSizeInput = z.infer<typeof ClassifySampleSizeInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifySampleSizeOutputSchema = z.object({
  sampleSize: z.string().describe('The identified sample size (N) of the research participants.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifySampleSizeOutput = z.infer<typeof ClassifySampleSizeOutputSchema>;

export async function classifySampleSize(input: ClassifySampleSizeInput): Promise<ClassifySampleSizeOutput> {
  return classifySampleSizeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifySampleSizePrompt',
  input: {schema: ClassifySampleSizeInputSchema},
  output: {schema: ClassifySampleSizeOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the sample size (N) of the research subjects in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Rules:
- Provide only the numeric value representing the total number of participants.
- If the sample size is not reported, respond with NR.

Respond with the sample size in the 'sampleSize' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifySampleSizeFlow = ai.defineFlow(
  {
    name: 'classifySampleSizeFlow',
    inputSchema: ClassifySampleSizeInputSchema,
    outputSchema: ClassifySampleSizeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
