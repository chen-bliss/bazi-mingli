import OpenAI from "openai";

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY && process.env.LLM_MODEL);
}

export function createLlmClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 LLM_API_KEY");
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  });
}

export function getLlmModel(): string {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

export async function chatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const client = createLlmClient();
  const model = getLlmModel();
  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    max_tokens: Number(process.env.LLM_MAX_TOKENS ?? 1200),
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}
