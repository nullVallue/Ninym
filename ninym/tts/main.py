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
async def tts_rvc_endpoint(request: TTSRequest):
    try:
        import io
        from fastapi.responses import StreamingResponse

        # 1. TTS Step (In-memory)
        rates = f"+{request.rate}%" if request.rate >= 0 else f"{request.rate}%"
        communicate = edge_tts.Communicate(request.text, request.voice, rate=rates)
        
        tts_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                tts_buffer.write(chunk["data"])
        
        tts_buffer.seek(0)

        # 2. RVC Step (In-memory)
        output_buffer = v_converter.convert_audio(
            audio_input=tts_buffer,
            audio_output_path=None, # Trigger in-memory return
            model_path=request.pth_path,
            index_path=request.index_path,
            pitch=request.pitch,
            f0_method=request.f0_method,
            index_rate=request.index_rate,
            volume_envelope=request.volume_envelope,
            protect=request.protect,
        )

        return StreamingResponse(
            output_buffer,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=tts.wav"}
        )

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8800)
