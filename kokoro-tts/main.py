import io
import wave
import os
import numpy as np
import soundfile as sf
from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from kokoro import KPipeline
from rvc_lite.infer import VoiceConverter

app = FastAPI(title="Kokoro TTS + RVC API (Compatible)")

# Hardcoded model paths (pointing back to the original models directory)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "ninym", "tts", "models")
DEFAULT_PTH = os.path.join(MODELS_DIR, "emilia", "Emilia_e600_s10200.pth")
DEFAULT_INDEX = os.path.join(MODELS_DIR, "emilia", "added_IVF812_Flat_nprobe_1_Emilia_v2.index")

# Initialize Pipelines
pipeline = KPipeline(lang_code='a')
v_converter = VoiceConverter()

class TTSRequest(BaseModel):
    text: str
    pth_path: str = DEFAULT_PTH
    index_path: str = DEFAULT_INDEX
    pitch: int = 12
    f0_method: str = "rmvpe"

@app.get("/stream")
@app.post("/stream")
async def stream_audio(text: str = Query(..., description="Text to convert to speech")):
    """Basic Kokoro Streaming (GET/POST)"""
    def generate_audio():
        generator = pipeline(text, voice='af_heart', speed=1.0)
        for i, (gs, ps, audio) in enumerate(generator):
            audio_int16 = (audio * 32767).astype(np.int16)
            buffer = io.BytesIO()
            if i == 0:
                with wave.open(buffer, 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(audio_int16.tobytes())
            else:
                buffer.write(audio_int16.tobytes())
            yield buffer.getvalue()
    return StreamingResponse(generate_audio(), media_type="audio/wav")

@app.post("/tts-rvc")
async def tts_rvc_endpoint(request: TTSRequest):
    """
    Drop-in replacement for the original TTS-RVC API.
    Uses Kokoro + RVC in-memory.
    """
    try:
        # 1. Generate Kokoro audio in memory
        audio_chunks = []
        generator = pipeline(request.text, voice='af_heart', speed=1.0)
        for gs, ps, audio in generator:
            audio_chunks.append(audio)
        
        if not audio_chunks:
            raise HTTPException(status_code=500, detail="Kokoro generated no audio")

        full_audio = np.concatenate(audio_chunks)
        
        # Convert to BytesIO buffer for RVC engine
        source_buffer = io.BytesIO()
        sf.write(source_buffer, full_audio, 24000, format='WAV')
        source_buffer.seek(0)

        # 2. RVC Conversion
        output_buffer = v_converter.convert_audio(
            audio_input=source_buffer,
            audio_output_path=None, # In-memory
            model_path=request.pth_path,
            index_path=request.index_path,
            pitch=request.pitch,
            f0_method=request.f0_method
        )

        if output_buffer is None:
             raise HTTPException(status_code=500, detail="RVC conversion returned None")

        return Response(
            content=output_buffer.getvalue(),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=converted.wav"}
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print(f"Kokoro Models Directory: {MODELS_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8801)
