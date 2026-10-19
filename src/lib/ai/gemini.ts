import { ProviderError, tryOnPrompt, type TryOnProvider } from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

type Part = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  inline_data?: { mime_type: string; data: string };
};

// Google's Gemini image editing model, called over its REST API.
export function geminiProvider(apiKey: string, model: string): TryOnProvider {
  return {
    name: `gemini:${model}`,
    async generate({ photo, reference, style }) {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: tryOnPrompt(style) },
                { inline_data: { mime_type: photo.mimeType, data: Buffer.from(photo.data).toString("base64") } },
                {
                  inline_data: { mime_type: reference.mimeType, data: Buffer.from(reference.data).toString("base64") },
                },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new ProviderError(
          `Gemini ${res.status}: ${json?.error?.message ?? "unknown error"}`,
          res.status === 429
            ? "Our AI stylist is busy right now. Please try again in a minute."
            : "The AI fitting didn't work this time. Please try again.",
        );
      }

      const parts: Part[] = json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline =
          part.inlineData ??
          (part.inline_data && { mimeType: part.inline_data.mime_type, data: part.inline_data.data });
        if (inline?.data) {
          return { data: new Uint8Array(Buffer.from(inline.data, "base64")), mimeType: inline.mimeType || "image/png" };
        }
      }

      const reason = json?.candidates?.[0]?.finishReason ?? json?.promptFeedback?.blockReason ?? "no image returned";
      throw new ProviderError(
        `Gemini returned no image (${reason})`,
        "The AI couldn't edit this photo. Try a clear, front-facing photo of just your face and shoulders.",
      );
    },
  };
}
