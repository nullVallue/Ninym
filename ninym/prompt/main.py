from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import ollama
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/chat/prompt")
async def chat_prompt(request: Request):
    body = await request.json()
    prompt = body.get("prompt")

    if not prompt:
        return {"success": False, "message": "Missing required fields"}, 400

    async def generate():
        stream = ollama.chat(
            model="qwen2.5",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            stream=True,
        )

        for chunk in stream:
            content = chunk.message.content
            if content:
                yield content

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
