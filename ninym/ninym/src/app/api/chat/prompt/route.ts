import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";


export async function POST(req: NextRequest) {

    const body = await req.json();


    const { prompt } = body;


    if (!prompt) {
        return NextResponse.json(
            {
                success: false,
                message: "Missing required fields"
            },
            {
                status: 400,
            }
        );
    }


    const stream = await ollama.chat({
        model: "qwen2.5",
        messages: [{
            role: "user",
            content: prompt,
        }],
        stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                const content = chunk.message.content;
                if (content) {
                    controller.enqueue(encoder.encode(content));
                }
            }
            controller.close();
        },
    });

    return new Response(readableStream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}