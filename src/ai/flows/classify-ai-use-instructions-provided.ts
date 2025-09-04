'use server';

/**
 * @fileOverview Identifies whether explicit instructions or training on AI use were provided to research subjects.
 *
 * - classifyAiUseInstructionsProvided - A function that handles the classification process.
 * - ClassifyAiUseInstructionsProvidedInput - The input type for the classifyAiUseInstructionsProvided function.
 * - ClassifyAiUseInstructionsProvidedOutput - The return type for the classifyAiUseInstructionsProvided function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyAiUseInstructionsProvidedInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyAiUseInstructionsProvidedInput = z.infer<typeof ClassifyAiUseInstructionsProvidedInputSchema>;

const AiUseInstructionsProvidedEnum = z.enum([
    'Yes',
    'No',
    'NR'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyAiUseInstructionsProvidedOutputSchema = z.object({
  aiUseInstructionsProvided: AiUseInstructionsProvidedEnum.describe('Identifies whether explicit instructions or training on AI use were provided.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyAiUseInstructionsProvidedOutput = z.infer<typeof ClassifyAiUseInstructionsProvidedOutputSchema>;

export async function classifyAiUseInstructionsProvided(input: ClassifyAiUseInstructionsProvidedInput): Promise<ClassifyAiUseInstructionsProvidedOutput> {
  return classifyAiUseInstructionsProvidedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyAiUseInstructionsProvidedPrompt',
  input: {schema: ClassifyAiUseInstructionsProvidedInputSchema},
  output: {schema: ClassifyAiUseInstructionsProvidedOutputSchema},
  prompt: `You are a research assistant. Your task is to identify whether the paper provides explicit instructions or training on AI use to the research subjects.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Yes": Explicit instructions or training on AI use are provided.
- "No": No explicit instructions or training are provided.
- "NR": Not reported / no information provided.

Rule:
- Respond with only the category name.

Respond with the category name in the 'aiUseInstructionsProvided' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyAiUseInstructionsProvidedFlow = ai.defineFlow(
  {
    name: 'classifyAiUseInstructionsProvidedFlow',
    inputSchema: ClassifyAiUseInstructionsProvidedInputSchema,
    outputSchema: ClassifyAiUseInstructionsProvidedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
