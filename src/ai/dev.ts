import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-pdf.ts';
import '@/ai/flows/extract-information-from-pdf.ts';
import '@/ai/flows/classify-subject-level.ts';
import '@/ai/flows/classify-discipline.ts';
import '@/ai/flows/classify-sub-discipline.ts';
import '@/ai/flows/classify-participants-group.ts';
import '@/ai/flows/classify-country-region.ts';
