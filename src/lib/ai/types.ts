export type ImageInput = { data: Uint8Array<ArrayBuffer>; mimeType: string };

export type TryOnRequest = {
  /** The customer's photo. */
  photo: ImageInput;
  /** A front-facing photo of the wig being worn, used as the style reference. */
  reference: ImageInput;
  /** Text description of the wig style. */
  style: string;
};

/** Any image-editing model that can put a wig on a photo. */
export interface TryOnProvider {
  name: string;
  generate(req: TryOnRequest): Promise<ImageInput>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
  }
}

export function tryOnPrompt(style: string) {
  return [
    "You are a professional hair stylist doing a virtual wig try-on.",
    "The first image is the customer. The second image shows the wig being worn by a model.",
    `Edit the customer's photo so they are wearing this exact wig: ${style}.`,
    "Match the wig's color, length, texture, wave pattern and parting from the second image.",
    "Keep the customer's face, identity, skin tone, expression, eyes, makeup, clothing, pose, framing and background exactly the same.",
    "Fully cover the customer's own hair. Make the lace hairline look natural against their forehead,",
    "and match the lighting, shadows and camera angle of the customer's photo.",
    "Return a single photorealistic image the same size and framing as the customer's photo.",
  ].join(" ");
}
