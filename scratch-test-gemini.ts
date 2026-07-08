import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in env");
    return;
  }
  console.log("GEMINI_API_KEY is set. Length:", apiKey.length);

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("Say hello");
      console.log(`Success for ${modelName}:`, res.response.text());
      break; // stop at first working model
    } catch (err: any) {
      console.error(`Failed for ${modelName}:`, err.message || err);
    }
  }
}

main();
