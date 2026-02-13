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
