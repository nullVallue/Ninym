from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import ollama
import json
import wave
import re
import wave
from piper import PiperVoice, SynthesisConfig
import io
import asyncio
import time
import unicodedata


def clean_text_for_tts(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)

    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"  # emoticons
        "\U0001f300-\U0001f5ff"  # symbols & pictographs
        "\U0001f680-\U0001f6ff"  # transport & map symbols
        "\U0001f1e0-\U0001f1ff"  # flags
        "\U00002702-\U000027b0"  # dingbats
        "\U000024c2-\U0001f251"  # enclosed characters
        "\U0001f926-\U0001f937"  # additional emoticons
        "\U00010000-\U0010ffff"  # additional unicode
        "\u2640-\u2642"  # gender symbols
        "\u2600-\u2b55"  # misc symbols
        "\u200d"  # zero width joiner
        "\u23cf"  # eject symbol
        "\u23e9"  # fast forward
        "\u231a"  # watch
        "\ufe0f"  # dingbats
        "\u3030"  # wavy dash
        "]+",
        flags=re.UNICODE,
    )
    text = emoji_pattern.sub("", text)

    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    text = re.sub(r"~~(.+?)~~", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)

    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    text = re.sub(r"^[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)

    text = re.sub(r"^>\s+", "", text, flags=re.MULTILINE)

    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"```.*", "", text)

    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)

    text = re.sub(r"^\s*[-*_]{3,}\s*$", "", text, flags=re.MULTILINE)

    text = re.sub(r"\s+", " ", text)

    text = text.strip()

    return text


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
            model="qwen3",
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


@app.post("/api/chat/voicePrompt")
async def chat_voice_prompt(request: Request):
    print("\n=== voicePrompt API called ===")
    body = await request.json()
    prompt = body.get("prompt")
    print(
        f"Received prompt: {prompt[:50]}..."
        if prompt and len(prompt) > 50
        else f"Received prompt: {prompt}"
    )

    if not prompt:
        print("Error: Missing prompt")
        return {"success": False, "message": "Missing required fields"}, 400

    print("Loading PiperVoice model...")
    voice = PiperVoice.load("./en_US-hfc_female-medium.onnx")
    # voice = PiperVoice.load("./otherModels/alexa.onnx")
    # voice = PiperVoice.load("./otherModels/cortana.onnx")
    # voice = PiperVoice.load("./otherModels/glados.onnx")
    # voice = PiperVoice.load("./otherModels/google_assistant.onnx")
    # voice = PiperVoice.load("./otherModels/zarvox.onnx")
    # voice = PiperVoice.load("./otherModels/jarvis-high.onnx")
    sample_rate = voice.config.sample_rate
    print(f"Model loaded successfully. Sample rate: {sample_rate} Hz")

    SENTENCE_END = re.compile(r"[.!?]+")

    total_start_time = time.time()
    llm_times = []
    tts_times = []
    total_audio_bytes = 0
    total_chars = 0
    sentence_count = 0

    async def generate():
        nonlocal tts_times, total_audio_bytes, total_chars, sentence_count
        sentence_buffer = ""
        sentence_count = 0

        print("Starting Ollama chat stream...")
        stream = ollama.chat(
            model="ninym",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        for chunk in stream:
            content = chunk.message.content
            if content:
                sentence_buffer += content
                print(f"Received chunk from Ollama: {content}")

                if SENTENCE_END.search(sentence_buffer):
                    matches = list(SENTENCE_END.finditer(sentence_buffer))
                    if matches:
                        last_match = matches[-1]
                        text_to_synth = sentence_buffer[: last_match.end()]
                        sentence_buffer = sentence_buffer[last_match.end() :]
                        sentence_count += 1

                        print(
                            f"\n--- Synthesizing sentence {sentence_count}: {text_to_synth} ---"
                        )

                        tts_start = time.time()
                        # Collect ALL PCM chunks for this sentence
                        raw_audio = b""
                        for audio_chunk in voice.synthesize(text_to_synth):
                            raw_audio += audio_chunk.audio_int16_bytes

                        tts_time = time.time() - tts_start
                        tts_times.append(tts_time)

                        print(f"Collected {len(raw_audio)} bytes of PCM")

                        # Wrap in WAV format
                        wav_buffer = io.BytesIO()
                        with wave.open(wav_buffer, "wb") as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)  # 16-bit
                            wf.setframerate(sample_rate)
                            wf.writeframes(raw_audio)

                        wav_data = wav_buffer.getvalue()
                        print(
                            f"Yielding complete WAV ({len(wav_data)} bytes) for sentence {sentence_count}"
                        )
                        total_audio_bytes += len(wav_data)
                        total_chars += len(text_to_synth)
                        yield wav_data

        # Handle remaining buffer
        if sentence_buffer.strip():
            sentence_count += 1
            print(
                f"\n--- Synthesizing final sentence {sentence_count}: {sentence_buffer} ---"
            )

            tts_start = time.time()
            raw_audio = b""
            for audio_chunk in voice.synthesize(sentence_buffer):
                raw_audio += audio_chunk.audio_int16_bytes

            tts_time = time.time() - tts_start
            tts_times.append(tts_time)

            print(f"Collected {len(raw_audio)} bytes of PCM")

            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(raw_audio)

            wav_data = wav_buffer.getvalue()
            print(
                f"Yielding final WAV ({len(wav_data)} bytes) for sentence {sentence_count}"
            )
            total_audio_bytes += len(wav_data)
            total_chars += len(sentence_buffer)
            yield wav_data

        total_time = time.time() - total_start_time
        avg_tts = sum(tts_times) / len(tts_times) if tts_times else 0
        audio_duration = total_audio_bytes / (sample_rate * 2)
        rtf = total_time / audio_duration if audio_duration > 0 else 0

        print(f"\n{'=' * 50}")
        print(f"BENCHMARK SUMMARY")
        print(f"{'=' * 50}")
        print(f"Total sentences:     {sentence_count}")
        print(f"Total characters:    {total_chars}")
        print(
            f"Total audio bytes:   {total_audio_bytes} ({total_audio_bytes / 1024:.1f} KB)"
        )
        print(f"Audio duration:      {audio_duration:.2f}s")
        print(f"Total time:          {total_time:.2f}s")
        print(f"Avg TTS time/sentence: {avg_tts:.3f}s")
        print(f"Real-time factor:    {rtf:.2f}x")
        print(f"{'=' * 50}\n")

    return StreamingResponse(
        generate(),
        media_type="audio/wav",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
