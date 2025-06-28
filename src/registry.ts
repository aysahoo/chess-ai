import { createProviderRegistry } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
// import { createAnthropic } from "@ai-sdk/anthropic";

export const registry = createProviderRegistry({
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
//   anthropic: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
});
