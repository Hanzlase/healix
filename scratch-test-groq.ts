import OpenAI from 'openai';
import 'dotenv/config';

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set in env");
    return;
  }
  console.log("GROQ_API_KEY is set. Length:", apiKey.length);

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    console.log("Fetching models from Groq...");
    const list = await client.models.list();
    console.log("Available models:");
    for (const m of list.data) {
      console.log(`- ${m.id}`);
    }
  } catch (err: any) {
    console.error("Failed to list models:", err.message || err);
  }

  // Let's test a simple completion with a common model
  const testModels = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
  for (const model of testModels) {
    try {
      console.log(`Testing model '${model}'...`);
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
      });
      console.log(`Success for '${model}':`, res.choices[0]?.message?.content);
      break;
    } catch (err: any) {
      console.error(`Failed for '${model}':`, err.message || err);
    }
  }
}

main();
