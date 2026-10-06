import { z } from "zod";

export const mediaInput = z.object({
  kind: z.enum(["photo", "audio"]),
  mime: z.enum(["image/jpeg", "audio/mpeg", "audio/mp4", "audio/webm", "audio/wav"]),
  base64: z.string().min(4).max(5_333_336).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  consent: z.literal(true),
}).strict();

export function decodeMedia(input: z.infer<typeof mediaInput>) {
  const bytes = Buffer.from(input.base64, "base64");
  if (bytes.toString("base64") !== input.base64) throw new Error("MEDIA_INVALID");
  const starts = (values: number[]) => values.every((value, index) => bytes[index] === value);
  if (input.kind === "photo") {
    if (input.mime !== "image/jpeg" || bytes.length > 250_000 || !starts([255, 216, 255]) || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw new Error("MEDIA_INVALID");
  } else {
    const valid = input.mime === "audio/mpeg" ? bytes.subarray(0, 3).toString() === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224)
      : input.mime === "audio/mp4" ? bytes.subarray(4, 8).toString() === "ftyp"
      : input.mime === "audio/webm" ? starts([26, 69, 223, 163])
      : input.mime === "audio/wav" ? bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WAVE" : false;
    if (!valid || bytes.length < 12 || bytes.length > 4_000_000) throw new Error("MEDIA_INVALID");
  }
  return bytes;
}

export function captureText(payload: unknown, kind: "photo" | "audio") {
  const parsed = z.object({ text: z.string().optional(), output: z.array(z.object({ type: z.string(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })).optional() }).parse(payload);
  const text = (kind === "audio" ? parsed.text : parsed.output?.filter(item => item.type === "message").flatMap(item => item.content?.filter(part => part.type === "output_text").map(part => part.text ?? "") ?? []).join("\n"))?.trim();
  if (!text || text.length > 4000) throw new Error("MEDIA_UNREADABLE");
  return text;
}
