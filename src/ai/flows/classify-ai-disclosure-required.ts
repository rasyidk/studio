'use server';

/**
 * @fileOverview Identifies whether AI disclosure is required in a research paper.
 *
 * - classifyAiDisclosureRequired - A function that handles the classification process.
 * - ClassifyAiDisclosureRequiredInput - The input type for the classifyAiDisclosureRequired function.
 * - ClassifyAiDisclosureRequiredOutput - The return type for the classifyAiDisclosureRequired function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyAiDisclosureRequiredInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyAiDisclosureRequiredInput = z.infer<typeof ClassifyAiDisclosureRequiredInputSchema>;

const AiDisclosureRequiredEnum = z.enum([
    'Yes',
    'No',
    'NR'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyAiDisclosureRequiredOutputSchema = z.object({
  aiDisclosureRequired: AiDisclosureRequiredEnum.describe('Identifies whether AI disclosure is required.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyAiDisclosureRequiredOutput = z.infer<typeof ClassifyAiDisclosureRequiredOutputSchema>;

export async function classifyAiDisclosureRequired(input: ClassifyAiDisclosureRequiredInput): Promise<ClassifyAiDisclosureRequiredOutput> {
  return classifyAiDisclosureRequiredFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyAiDisclosureRequiredPrompt',
  input: {schema: ClassifyAiDisclosureRequiredInputSchema},
  output: {schema: ClassifyAiDisclosureRequiredOutputSchema},
  prompt: `You are a research assistant. Your task is to identify whether the paper requires AI disclosure.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Yes": AI disclosure is required.
- "No": AI disclosure is not required.
- "NR": Not reported / no information provided.

Rule:
- Respond with only the category name.

Respond with the category name in the 'aiDisclosureRequired' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyAiDisclosureRequiredFlow = ai.defineFlow(
  {
    name: 'classifyAiDisclosureRequiredFlow',
    inputSchema: ClassifyAiDisclosureRequiredInputSchema,
    outputSchema: ClassifyAiDisclosureRequiredOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
