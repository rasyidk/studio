'use server';

/**
 * @fileOverview Identifies the research design type reported in a research paper.
 *
 * - classifyDesignType - A function that handles the classification process.
 * - ClassifyDesignTypeInput - The input type for the classifyDesignType function.
 * - ClassifyDesignTypeOutput - The return type for the classifyDesignType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyDesignTypeInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyDesignTypeInput = z.infer<typeof ClassifyDesignTypeInputSchema>;

const DesignTypeEnum = z.enum([
    'Exp',
    'Quasi',
    'PrePost',
    'CrossSection',
    'Case',
    'Mixed',
    'Conceptual',
    'NR'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyDesignTypeOutputSchema = z.object({
  designType: DesignTypeEnum.describe('The identified research design type of the research paper.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyDesignTypeOutput = z.infer<typeof ClassifyDesignTypeOutputSchema>;

export async function classifyDesignType(input: ClassifyDesignTypeInput): Promise<ClassifyDesignTypeOutput> {
  return classifyDesignTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyDesignTypePrompt',
  input: {schema: ClassifyDesignTypeInputSchema},
  output: {schema: ClassifyDesignTypeOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the research design type reported in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definition:
- "Exp": Experimental study.
- "Quasi": Quasi-experimental study.
- "PrePost": Pre-test/Post-test design.
- "CrossSection": Cross-sectional study.
- "Case": Case study.
- "Mixed": Mixed-methods study.
- "Conceptual": Conceptual or theoretical study.

Rule:
- Respond with only the category name.
- If the design type is not reported, respond with NR.

Respond with the category name in the 'designType' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyDesignTypeFlow = ai.defineFlow(
  {
    name: 'classifyDesignTypeFlow',
    inputSchema: ClassifyDesignTypeInputSchema,
    outputSchema: ClassifyDesignTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
