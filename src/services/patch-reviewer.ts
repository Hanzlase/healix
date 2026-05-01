import { z } from 'zod';
import { getGroqClient } from '@/services/groq-client';

export const PatchReviewOutputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().min(1),
  risk_level: z.enum(['low', 'medium', 'high']),
});

export type PatchReviewOutput = z.infer<typeof PatchReviewOutputSchema>;

export async function reviewPatch(input: {
  rootCause: string;
  originalCode: string;
  patch: string;
}): Promise<PatchReviewOutput> {
  const client = getGroqClient();

  const system =
    'You are a strict patch reviewer (GPT-OSS-120B) for CI/CD self-healing. ' +
    'Your goal is to prevent bad patches from being deployed. ' +
    'RULES: ' +
    '- Reject if unrelated code changes exist ' +
    '- Reject if security risk detected ' +
    '- Reject if root cause not addressed ' +
    '- Reject if over-broad modifications ' +
    '- Reject if any style changes are present ' +
    'Output MUST be STRICT JSON: {"status": "approved | rejected", "reason": "short explanation", "risk_level": "low | medium | high"}';

  const user = {
    rootCause: input.rootCause,
    originalCode: input.originalCode,
    patch: input.patch,
  };

  const res = await client.chat.completions.create({
    model: 'gpt-oss-120b',
    temperature: 0,
    top_p: 1,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(user) },
    ],
  });

  const text = (res.choices[0]?.message?.content ?? '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Reviewer returned non-JSON output');
  const json = JSON.parse(text.slice(first, last + 1));
  return PatchReviewOutputSchema.parse(json);
}
