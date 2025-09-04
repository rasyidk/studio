'use server';

/**
 * @fileOverview Identifies the country or region of research participants.
 *
 * - classifyCountryRegion - A function that handles the classification process.
 * - ClassifyCountryRegionInput - The input type for the classifyCountryRegion function.
 * - ClassifyCountryRegionOutput - The return type for the classifyCountryRegion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyCountryRegionInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyCountryRegionInput = z.infer<typeof ClassifyCountryRegionInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyCountryRegionOutputSchema = z.object({
  countryOrRegion: z.string().describe('The identified country or region of the research participants.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyCountryRegionOutput = z.infer<typeof ClassifyCountryRegionOutputSchema>;

export async function classifyCountryRegion(input: ClassifyCountryRegionInput): Promise<ClassifyCountryRegionOutput> {
  return classifyCountryRegionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyCountryRegionPrompt',
  input: {schema: ClassifyCountryRegionInputSchema},
  output: {schema: ClassifyCountryRegionOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the Country_or_Region of the research participants in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definitions:
Country_or_Region refers to the country or geographical region where the research participants come from.

Rules:
- If one country is reported, write the country name.
- If participants come from multiple countries or regions, separate them with semicolons (;).
- If the country or region is not reported, respond with NR (Not Reported).

Respond with the country/region name(s) in the 'countryOrRegion' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyCountryRegionFlow = ai.defineFlow(
  {
    name: 'classifyCountryRegionFlow',
    inputSchema: ClassifyCountryRegionInputSchema,
    outputSchema: ClassifyCountryRegionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
