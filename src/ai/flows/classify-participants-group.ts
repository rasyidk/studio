'use server';

/**
 * @fileOverview Identifies the participants group in a research paper.
 *
 * - classifyParticipantsGroup - A function that handles the classification process.
 * - ClassifyParticipantsGroupInput - The input type for the classifyParticipantsGroup function.
 * - ClassifyParticipantsGroupOutput - The return type for the classifyParticipantsGroup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyParticipantsGroupInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content of the PDF document.'),
});
export type ClassifyParticipantsGroupInput = z.infer<typeof ClassifyParticipantsGroupInputSchema>;

const ParticipantsGroupEnum = z.enum([
    'Students',
    'Teacher',
    'Mixed'
]);

const SourceSchema = z.object({
  page: z.number().optional().describe('The page number from which the information was extracted.'),
  text: z.string().optional().describe('The exact paragraph or sentence from the document that was used to formulate the answer.'),
});

const ClassifyParticipantsGroupOutputSchema = z.object({
  participantsGroup: ParticipantsGroupEnum.describe('The identified group of the research participants.'),
  sources: z.array(SourceSchema).describe('A list of sources (page and text) used to justify the classification.'),
});
export type ClassifyParticipantsGroupOutput = z.infer<typeof ClassifyParticipantsGroupOutputSchema>;

export async function classifyParticipantsGroup(input: ClassifyParticipantsGroupInput): Promise<ClassifyParticipantsGroupOutput> {
  return classifyParticipantsGroupFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyParticipantsGroupPrompt',
  input: {schema: ClassifyParticipantsGroupInputSchema},
  output: {schema: ClassifyParticipantsGroupOutputSchema},
  prompt: `You are a research assistant. Your task is to identify the Participants_Group of the research subjects in the given paper.

The PDF content is provided with page markers (e.g., "Page 1: ...").
You MUST identify the page number from which you extracted the source text.

Definitions:
Participants_Group refers to the type of research subjects in the study. Categories:
- "Students": participants are only students.
- "Teacher": participants are only teachers.
- "Mixed": participants include both students and teachers, or other combinations.

Choose only one category from the list above.
Respond with the category name in the 'participantsGroup' field.
Also, provide all the exact sentences or phrases from the document that justify your classification in the 'sources' field, along with their page numbers.

Paper Content:
{{{pdfText}}}
  \n`,
});

const classifyParticipantsGroupFlow = ai.defineFlow(
  {
    name: 'classifyParticipantsGroupFlow',
    inputSchema: ClassifyParticipantsGroupInputSchema,
    outputSchema: ClassifyParticipantsGroupOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
