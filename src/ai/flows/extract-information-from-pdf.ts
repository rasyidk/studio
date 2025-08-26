'use server';

/**
 * @fileOverview Extracts specific information from a PDF document based on a user's query.
 *
 * - extractInformation - A function that handles the information extraction process.
 * - ExtractInformationInput - The input type for the extractInformation function.
 * - ExtractInformationOutput - The return type for the extractInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInformationInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document, with each page prefixed by "Page X:".'),
  query: z.string().describe('The user query to extract specific information from the PDF.'),
});
export type ExtractInformationInput = z.infer<typeof ExtractInformationInputSchema>;

const ExtractInformationOutputSchema = z.object({
  extractedInformation: z.string().describe('The extracted information from the PDF based on the query.'),
  sourcePage: z.number().optional().describe('The page number from which the information was extracted.'),
  sourceText: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});
export type ExtractInformationOutput = z.infer<typeof ExtractInformationOutputSchema>;

export async function extractInformation(input: ExtractInformationInput): Promise<ExtractInformationOutput> {
  return extractInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInformationPrompt',
  input: {schema: ExtractInformationInputSchema},
  output: {schema: ExtractInformationOutputSchema},
  prompt: `You are an expert AI assistant specializing in extracting information from PDF documents.

  Given the content of a PDF document and a user's query, extract the most relevant information from the document that answers the query.
  The PDF content is provided with page markers (e.g., "Page 1: ...").
  You MUST identify the page number where you found the information and return it in the 'sourcePage' field.
  You MUST also extract the exact paragraph or sentence that contains the answer and return it in the 'sourceText' field.
  If the query cannot be answered using the content of the PDF, respond with a message saying that you cannot answer the question and do not provide a source page or source text.

  PDF Content: {{{pdfText}}}
  User Query: {{{query}}}
  \n`,
});

const extractInformationFlow = ai.defineFlow(
  {
    name: 'extractInformationFlow',
    inputSchema: ExtractInformationInputSchema,
    outputSchema: ExtractInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
