import { httpPost } from "../helpers/http/httpClient";


interface ModelResponse {
  success: boolean;
  message: {
    model: string;
    created_at: string;
    message: {
      role: string;
      content: string;
    };
    done: boolean;
    done_reason: string;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
  };
}




export async function sendPrompt(
  message: string,
): Promise<ModelResponse> {
  return await httpPost("/api/chat/prompt", {
    prompt: message
  })
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

