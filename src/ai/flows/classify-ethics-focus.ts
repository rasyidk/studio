'use server';

/**
 * @fileOverview Identifies the ethical focus(es) of AI intervention in a research paper.
 *
 * - classifyEthicsFocus - A function that handles the classification process.
 * - ClassifyEthicsFocusInput - The input type for the classifyEthicsFocus function.
 * - ClassifyEthicsFocusOutput - The return type for the classifyEthicsFocus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyEthicsFocusInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyEthicsFocusInput = z.infer<typeof ClassifyEthicsFocusInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyEthicsFocusOutputSchema = z.object({
  ethicsFocus: z.string().describe('The identified ethical focus(es) of AI intervention.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyEthicsFocusOutput = z.infer<typeof ClassifyEthicsFocusOutputSchema>;

export async function classifyEthicsFocus(input: ClassifyEthicsFocusInput): Promise<ClassifyEthicsFocusOutput> {
  return classifyEthicsFocusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyEthicsFocusPrompt',
  input: {schema: ClassifyEthicsFocusInputSchema},
  output: {schema: ClassifyEthicsFocusOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the ethical focus(es) of AI intervention in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definitions:
- "Integrity_Policy": AI promotes academic or research integrity, following institutional policies.
- "Bias_Fairness": AI addresses bias, fairness, or equity issues.
- "Disclosure": AI use is disclosed or transparency is emphasized.
- "Detection_Appeal": AI is used in detection systems, or subjects can appeal AI decisions.
- "Ethics_Education": AI supports teaching or learning about ethics.
- "Inclusivity_Multilingual": AI promotes inclusivity or supports multiple languages.

Rules:
- Respond with only the category names separated by commas if multiple.
- If no ethical focus is mentioned, respond with NR.

Respond with the category name(s) in the 'ethicsFocus' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyEthicsFocusFlow = ai.defineFlow(
  {
    name: 'classifyEthicsFocusFlow',
    inputSchema: ClassifyEthicsFocusInputSchema,
    outputSchema: ClassifyEthicsFocusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
