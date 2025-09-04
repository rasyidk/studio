import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-pdf.ts';
import '@/ai/flows/extract-information-from-pdf.ts';
import '@/ai/flows/classify-subject-level.ts';
import '@/ai/flows/classify-discipline.ts';
import '@/ai_flows/classify-sub-discipline.ts';
import '@/ai/flows/classify-participants-group.ts';
import '@/ai/flows/classify-country-region.ts';
import '@/ai/flows/classify-sample-size.ts';
import '@/ai/flows/classify-ai-tech-type.ts';
import '@/ai/flows/classify-emi-context.ts';
