// Pasa los audios a texto con Whisper en Workers AI (gratis dentro del límite diario).

import type { Env } from "./env";

function aBase64(bytes: Uint8Array): string {
  let bin = "";
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  return btoa(bin);
}

export async function transcribir(env: Env, audio: ArrayBuffer): Promise<string> {
  const r = (await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
    audio: aBase64(new Uint8Array(audio)),
    language: "es",
  })) as { text?: string };
  return (r.text ?? "").trim();
}
