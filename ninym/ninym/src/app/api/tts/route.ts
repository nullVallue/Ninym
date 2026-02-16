import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Call the Python TTS API
        const response = await fetch("http://localhost:8000/tts?text=" + encodeURIComponent(text), {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error("Failed to generate TTS from Python API");
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": 'attachment; filename="speech.mp3"',
            },
        });
    } catch (error: any) {
        console.error("TTS Proxy Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
