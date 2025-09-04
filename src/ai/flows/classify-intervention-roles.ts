'use server';

/**
 * @fileOverview Identifies the roles or benefits of AI intervention for research subjects.
 *
 * - classifyInterventionRoles - A function that handles the classification process.
 * - ClassifyInterventionRolesInput - The input type for the classifyInterventionRoles function.
 * - ClassifyInterventionRolesOutput - The return type for the classifyInterventionRoles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyInterventionRolesInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyInterventionRolesInput = z.infer<typeof ClassifyInterventionRolesInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyInterventionRolesOutputSchema = z.object({
  interventionRoles: z.string().describe('The identified roles or benefits of AI intervention.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyInterventionRolesOutput = z.infer<typeof ClassifyInterventionRolesOutputSchema>;

export async function classifyInterventionRoles(input: ClassifyInterventionRolesInput): Promise<ClassifyInterventionRolesOutput> {
  return classifyInterventionRolesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyInterventionRolesPrompt',
  input: {schema: ClassifyInterventionRolesInputSchema},
  output: {schema: ClassifyInterventionRolesOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the roles or benefits of AI intervention for the research subjects in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definitions:
- "Knowledge scaffolding": AI helps provide guidance, explanations, or structure to support learning.
- "Feedback & revision": AI helps subjects receive feedback and improve or revise their work.
- "Production booster": AI helps subjects produce work faster or more efficiently.
- "Metacognition/SRL": AI supports self-reflection, self-regulation, or metacognitive strategies.
- "Policy": AI is used to guide decisions, rules, or policies affecting subjects.
- "Others": any other role not covered above.

Rules:
- Respond with only the category names separated by commas if multiple.
- If no roles are mentioned, respond with NR.

Respond with the category name(s) in the 'interventionRoles' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyInterventionRolesFlow = ai.defineFlow(
  {
    name: 'classifyInterventionRolesFlow',
    inputSchema: ClassifyInterventionRolesInputSchema,
    outputSchema: ClassifyInterventionRolesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
