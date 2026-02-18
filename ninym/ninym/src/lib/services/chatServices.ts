const PROMPT_API_URL = process.env.NEXT_PUBLIC_PROMPT_API_URL || "http://localhost:8000/api/chat/prompt";

export async function sendPrompt(
  message: string,
): Promise<Response> {
  return await fetch(PROMPT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: message }),
  });
}


export function sendPromptAudioStream(
  message: string
): ReadableStream<Uint8Array> {
  const controller = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await fetch("http://localhost:8000/api/chat/voicePrompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: message }),
        });

        if (!response.ok) {
          controller.error(new Error("Failed to generate voice prompt"));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error("No response body"));
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            controller.enqueue(new Uint8Array(value));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return controller;
}


export async function generateTTS(text: string): Promise<Blob> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate TTS");
  }

  return await response.blob();
}

