import os
import uuid
import asyncio
import edge_tts
from fastapi import FastAPI, HTTPException
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
async def tts_rvc_endpoint(request: TTSRequest):
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
        # Note: VoiceConverter.convert_audio is not async, so we might want to run it in a thread 
        # for a real production API, but for this stripped version, direct call is fine.
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

        return {
            "status": "success",
            "output_file": output_rvc_path,
            "message": f"Conversion completed. File saved as {output_rvc_path}"
        }

    except Exception as e:
        # Cleanup on error
        if 'temp_tts_path' in locals() and os.path.exists(temp_tts_path):
            os.remove(temp_tts_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8800)
