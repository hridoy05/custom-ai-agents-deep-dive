import type { Message } from "./types";
import { SYSTEM_PROMPT } from "./promt";

export async function askGemini(
  messages: Message[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  const model =
    process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },

    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
        ],
      },

      contents: messages,

      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Gemini API error: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
console.log(data)
  const generatedText = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("");

  if (!generatedText) {
    throw new Error("Gemini returned an empty response");
  }

  return generatedText;
}
