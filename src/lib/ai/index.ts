import { geminiProvider } from "./gemini";
import type { TryOnProvider } from "./types";

export { ProviderError } from "./types";

/** Picks the AI provider from environment variables, or null if none is configured. */
export function getTryOnProvider(): TryOnProvider | null {
  if (process.env.GEMINI_API_KEY) {
    return geminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image");
  }
  return null;
}
