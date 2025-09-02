import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-pdf.ts';
import '@/ai/flows/extract-information-from-pdf.ts';
import '@/ai/flows/classify-subject-level.ts';
