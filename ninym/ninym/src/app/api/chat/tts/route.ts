import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    return handleTTS(req);
}

export async function POST(req: NextRequest) {
    return handleTTS(req);
}

async function handleTTS(req: NextRequest) {
    try {
        let text = "";
        if (req.method === "POST") {
            const body = await req.json();
            text = body.text;
        } else {
            const { searchParams } = new URL(req.url);
            text = searchParams.get("text") || "";
        }

        if (!text) {
            return NextResponse.json({ error: "Missing field, text is required for the call. " }, { status: 400 });
        }

        const fastApiRes = await fetch("http://localhost:8800/tts-rvc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text }),
        });

        if (!fastApiRes.ok) {
            throw new Error("FastAPI TTS request failed");
        }

        const stream = fastApiRes.body;

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "inline; filename=tts.wav",
                "Cache-Control": "no-cache"
            }
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }
}