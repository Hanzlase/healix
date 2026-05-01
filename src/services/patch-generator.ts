import { z } from 'zod';
import { getGroqClient } from '@/services/groq-client';

export const PatchGeneratorInputSchema = z.object({
  root_cause: z.string().min(1),
  logs: z.string().min(1),
  file: z.string().min(1),
  code_context: z.string().min(1),
});

export type PatchGeneratorInput = z.infer<typeof PatchGeneratorInputSchema>;

export type GeneratedPatch = {
  patch: string; // unified diff OR replacement block as requested
};

export async function generatePatch(input: PatchGeneratorInput): Promise<GeneratedPatch> {
  const client = getGroqClient();

  const system =
    'You are an autonomous CI fix generator (GPT-OSS-120B). ' +
    'Generate a minimal, precise code fix for a CI/CD failure. ' +
    'RULES: ' +
    '- No unnecessary refactoring ' +
    '- Fix ONLY what caused failure ' +
    '- No style changes ' +
    '- No extra features ' +
    '- Output MUST be ONLY the code patch in unified diff format (- old, + fixed) or a full file replacement. ' +
    '- NO markdown, NO backticks, NO explanations. Just the code.';

  const userContent = JSON.stringify({
    root_cause: input.root_cause,
    logs: input.logs,
    file: input.file,
    code_context: input.code_context,
  });

  const res = await client.chat.completions.create({
    model: 'gpt-oss-120b',
    temperature: 0,
    top_p: 1,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
  });

  const patch = (res.choices[0]?.message?.content ?? '').trim();
  return { patch };
}
