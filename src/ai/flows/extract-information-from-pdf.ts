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

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ExtractInformationOutputSchema = z.object({
  extractedInformation: z.string().describe('The extracted information from the PDF based on the query.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to formulate the answer.'),
});
export type ExtractInformationOutput = z.infer<typeof ExtractInformationOutputSchema>;

export async function extractInformation(input: ExtractInformationInput): Promise<ExtractInformationOutput> {
  return extractInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInformationPrompt',
  input: {schema: ExtractInformationInputSchema},
  output: {schema: ExtractInformationOutputSchema},
  prompt: `You are an expert AI assistant specializing in extracting and synthesizing information from PDF documents.

  Given the content of a PDF document and a user's query, extract the most relevant information from the document that answers the query. 
  Your answer should be concise and straight to the point.
  You should be able to understand implicit context and synthesize information from multiple parts of the document to provide a comprehensive answer.

  IMPORTANT: You MUST only use the information present in the PDF document provided. Do not use any external knowledge or access the internet to answer the query.

  The PDF content is provided with page markers (e.g., "Page 1: ...").
  You MUST identify all the page numbers and the exact paragraphs or sentences that contain the answer and return them in the 'sources' field. If the answer is synthesized from multiple parts, include all relevant sources.
  If the query cannot be answered using the content of the PDF, you must state that the document does not contain the answer. Do not provide any sources in this case.

  IMPORTANT: Do not take information from the literature review section of the paper. Focus on the main findings and methodology of the research.

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
