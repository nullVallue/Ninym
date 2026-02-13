import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";


export async function POST(req: NextRequest){

    const body = await req.json();


    const { prompt } = body;


    if(!prompt) {
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


    const response = await ollama.chat({
        model: "gemma3n",
        messages: [{
            role: "user",
            content: prompt,
        }],
    });


    return NextResponse.json(
        {
            success: true,
            message: response,
        },
        {
            status: 200,
        }
    )




}