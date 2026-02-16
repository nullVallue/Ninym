import os
import uuid
import asyncio
import edge_tts
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from rvc_lite.infer import VoiceConverter
import torch

app = FastAPI(title="TTS + RVC API")

# Initialize VoiceConverter
# We'll load the model lazily or at startup. For this bare stripped version, 
# we'll provide a way to specify paths.
v_converter = VoiceConverter()


# Hardcoded model paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PTH = os.path.join(BASE_DIR, "models", "emilia", "Emilia_e600_s10200.pth")
DEFAULT_INDEX = os.path.join(BASE_DIR, "models", "emilia", "added_IVF812_Flat_nprobe_1_Emilia_v2.index")


class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-EmmaNeural"  # Default voice
    rate: int = 0
    pitch: int = 10
    pth_path: str = DEFAULT_PTH
    index_path: str = DEFAULT_INDEX 
    index_rate: float = 0.75
    volume_envelope: float = 1.0
    protect: float = 0.33
    f0_method: str = "rmvpe"

@app.post("/tts-rvc")
async def tts_rvc_endpoint(request: TTSRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Generate unique IDs for temporary files
        job_id = str(uuid.uuid4())
        temp_tts_path = f"temp_tts_{job_id}.wav"
        output_rvc_path = f"output_{job_id}.wav"

        # 2. TTS Step
        # Rate format: +0% or -10%
        rates = f"+{request.rate}%" if request.rate >= 0 else f"{request.rate}%"
        communicate = edge_tts.Communicate(request.text, request.voice, rate=rates)
        await communicate.save(temp_tts_path)

        # 3. RVC Step
        v_converter.convert_audio(
            audio_input_path=temp_tts_path,
            audio_output_path=output_rvc_path,
            model_path=request.pth_path,
            index_path=request.index_path,
            pitch=request.pitch,
            f0_method=request.f0_method,
            index_rate=request.index_rate,
            volume_envelope=request.volume_envelope,
            protect=request.protect,
        )

        # Cleanup temp TTS file
        if os.path.exists(temp_tts_path):
            os.remove(temp_tts_path)

        # Add background task to delete the output file after response
        background_tasks.add_task(os.remove, output_rvc_path)

        return FileResponse(
            path=output_rvc_path,
            media_type="audio/wav",
            filename="tts.wav"
        )

    except Exception as e:
        # Cleanup on error
        if 'temp_tts_path' in locals() and os.path.exists(temp_tts_path):
            os.remove(temp_tts_path)
        if 'output_rvc_path' in locals() and os.path.exists(output_rvc_path):
            os.remove(output_rvc_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8800)
