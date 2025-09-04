'use server';

/**
 * @fileOverview Identifies the type(s) of AI technology used in a research paper.
 *
 * - classifyAiTechType - A function that handles the classification process.
 * - ClassifyAiTechTypeInput - The input type for the classifyAiTechType function.
 * - ClassifyAiTechTypeOutput - The return type for the classifyAiTechType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyAiTechTypeInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyAiTechTypeInput = z.infer<typeof ClassifyAiTechTypeInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyAiTechTypeOutputSchema = z.object({
  aiTechType: z.string().describe('The identified AI technology type(s) used in the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyAiTechTypeOutput = z.infer<typeof ClassifyAiTechTypeOutputSchema>;

export async function classifyAiTechType(input: ClassifyAiTechTypeInput): Promise<ClassifyAiTechTypeOutput> {
  return classifyAiTechTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyAiTechTypePrompt',
  input: {schema: ClassifyAiTechTypeInputSchema},
  output: {schema: ClassifyAiTechTypeOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the type(s) of AI technology used in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Choose all that apply from the following categories:
- "GenAI": Generative AI tools.
- "MT": Machine Translation.
- "ASR": Automatic Speech Recognition.
- "GrammarAid": Grammar or writing assistance tools.
- "Chatbot": Chatbot or conversational AI tools.
- "Others": Any other AI technology not listed above.

Rule:
- Respond with only the category names separated by commas if multiple.
- If no AI technology is mentioned, respond with NR.

Respond with the category name(s) in the 'aiTechType' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyAiTechTypeFlow = ai.defineFlow(
  {
    name: 'classifyAiTechTypeFlow',
    inputSchema: ClassifyAiTechTypeInputSchema,
    outputSchema: ClassifyAiTechTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
