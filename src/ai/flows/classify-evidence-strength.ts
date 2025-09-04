'use server';

/**
 * @fileOverview Identifies the strength of evidence reported in a research paper.
 *
 * - classifyEvidenceStrength - A function that handles the classification process.
 * - ClassifyEvidenceStrengthInput - The input type for the classifyEvidenceStrength function.
 * - ClassifyEvidenceStrengthOutput - The return type for the classifyEvidenceStrength function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyEvidenceStrengthInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyEvidenceStrengthInput = z.infer<typeof ClassifyEvidenceStrengthInputSchema>;

const EvidenceStrengthEnum = z.enum([
    'A',
    'B',
    'C',
    'D',
    'NR'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyEvidenceStrengthOutputSchema = z.object({
  evidenceStrength: EvidenceStrengthEnum.describe('The identified evidence strength of the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyEvidenceStrengthOutput = z.infer<typeof ClassifyEvidenceStrengthOutputSchema>;

export async function classifyEvidenceStrength(input: ClassifyEvidenceStrengthInput): Promise<ClassifyEvidenceStrengthOutput> {
  return classifyEvidenceStrengthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyEvidenceStrengthPrompt',
  input: {schema: ClassifyEvidenceStrengthInputSchema},
  output: {schema: ClassifyEvidenceStrengthOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the strength of evidence reported in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "A": Experimental, Quasi-experimental, Pre-post, or Control study designs.
- "B": Quantitative or Mixed-methods studies.
- "C": Qualitative or Descriptive studies.
- "D": Conceptual studies (theoretical, no empirical data).

Rule:
- Respond with only the category name (A, B, C, or D).
- If the evidence strength is not reported, respond with NR.

Respond with the category name in the 'evidenceStrength' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyEvidenceStrengthFlow = ai.defineFlow(
  {
    name: 'classifyEvidenceStrengthFlow',
    inputSchema: ClassifyEvidenceStrengthInputSchema,
    outputSchema: ClassifyEvidenceStrengthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
