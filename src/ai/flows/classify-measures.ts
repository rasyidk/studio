'use server';

/**
 * @fileOverview Identifies the measures or instruments used in a research paper.
 *
 * - classifyMeasures - A function that handles the classification process.
 * - ClassifyMeasuresInput - The input type for the classifyMeasures function.
 * - ClassifyMeasuresOutput - The return type for the classifyMeasures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyMeasuresInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyMeasuresInput = z.infer<typeof ClassifyMeasuresInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyMeasuresOutputSchema = z.object({
  measures: z.string().describe('The identified measures or instruments used in the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyMeasuresOutput = z.infer<typeof ClassifyMeasuresOutputSchema>;

export async function classifyMeasures(input: ClassifyMeasuresInput): Promise<ClassifyMeasuresOutput> {
  return classifyMeasuresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyMeasuresPrompt',
  input: {schema: ClassifyMeasuresInputSchema},
  output: {schema: ClassifyMeasuresOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the measures or instruments used in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Choose all that apply from the following categories:
- "Test": standardized or researcher-designed tests.
- "CAF": corrective/accuracy/fluency metrics.
- "Rubric": scoring rubrics for performance assessment.
- "Survey": questionnaires or surveys.
- "Interview": structured, semi-structured, or unstructured interviews.
- "Log": system or learning logs.
- "Trace": trace data, e.g., clickstreams, keystrokes, or digital footprints.
- "Obs": observations.
- "PolicyDoc": documents or policies analyzed.
- "Others": any other measures not covered above.

Rules:
- Respond with only the category names separated by commas if multiple.
- If no measures are reported, respond with NR.

Respond with the category name(s) in the 'measures' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyMeasuresFlow = ai.defineFlow(
  {
    name: 'classifyMeasuresFlow',
    inputSchema: ClassifyMeasuresInputSchema,
    outputSchema: ClassifyMeasuresOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
