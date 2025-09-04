'use server';

/**
 * @fileOverview Identifies the language skills targeted or supported by AI in a research paper.
 *
 * - classifyRolesSkills - A function that handles the classification process.
 * - ClassifyRolesSkillsInput - The input type for the classifyRolesSkills function.
 * - ClassifyRolesSkillsOutput - The return type for the classifyRolesSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyRolesSkillsInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyRolesSkillsInput = z.infer<typeof ClassifyRolesSkillsInputSchema>;

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyRolesSkillsOutputSchema = z.object({
  rolesSkills: z.string().describe('The identified language skills targeted or supported by AI.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyRolesSkillsOutput = z.infer<typeof ClassifyRolesSkillsOutputSchema>;

export async function classifyRolesSkills(input: ClassifyRolesSkillsInput): Promise<ClassifyRolesSkillsOutput> {
  return classifyRolesSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyRolesSkillsPrompt',
  input: {schema: ClassifyRolesSkillsInputSchema},
  output: {schema: ClassifyRolesSkillsOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the language skills targeted or supported by AI in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definitions:
- "L": Listening
- "S": Speaking
- "R": Reading
- "W": Writing
- "T": Translation

Rules:
- Respond with only the category codes (L, S, R, W, T) and "Others" if not covered.
- Separate the codes with commas if multiple skills are targeted.
- If no skills are mentioned, respond with NR.

Respond with the category code(s) in the 'rolesSkills' field based on the rules.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyRolesSkillsFlow = ai.defineFlow(
  {
    name: 'classifyRolesSkillsFlow',
    inputSchema: ClassifyRolesSkillsInputSchema,
    outputSchema: ClassifyRolesSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
