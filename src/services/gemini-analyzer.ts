import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type { AiReadyContext, GeminiRootCause } from '@/lib/types';

const GeminiRootCauseSchema = z.object({
  root_cause: z.string().min(1),
  category: z.enum(['runtime', 'build', 'dependency', 'config']),
  confidence: z.number().min(0).max(1),
  affected_file: z.string().min(1),
});

export async function analyzeRootCause(input: AiReadyContext): Promise<GeminiRootCause> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const system =
    'You are an expert CI/CD failure analyst. ' +
    'Return STRICT JSON ONLY matching this schema: ' +
    '{"root_cause":"string explanation","category":"runtime|build|dependency|config","confidence":0.0,"affected_file":"string"}. ' +
    'Do NOT include markdown. Do NOT include backticks. Do NOT generate code fixes; only explain the likely cause.';

  const prompt = {
    repo: input.repo,
    commit: input.commit,
    errorSummary: input.errorSummary,
    keyErrors: input.keyErrors,
    stackTraces: input.stackTraces,
    filePaths: input.filePaths,
    truncatedLog: input.truncatedLog,
  };

  const res = await model.generateContent([
    { text: system },
    { text: JSON.stringify(prompt) },
  ]);

  const text = res.response.text().trim();

  // Parse JSON deterministically: take first JSON object.
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Gemini returned non-JSON output');

  const json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
  const parsed = GeminiRootCauseSchema.parse(json);
  return parsed;
}
