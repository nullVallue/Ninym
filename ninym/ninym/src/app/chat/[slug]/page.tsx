"use client"

import { notFound } from "next/navigation";
import visual from "../../../assets/chat/SuiseiHello.png"
import SuiseiHello from "../../../assets/chat/SuiseiHello.png"
import SuiseiEyes from "../../../assets/chat/SuiseiEyes.gif"
import { useEffect, useRef, useState } from "react";
import { Send } from "@/components/animate-ui/icons/send";
import { generateTTS, sendPromptAudioStream } from "@/lib/services/chatServices";
import ChatBubble from "@/components/chat/ChatBubble";
import AudioVisualizer from "@/components/chat/AudioVisualizer";

type Chat = {
    id: string
    name: string
    slug: string
}

function getChat(slug: string){
    return {id: "001", name: "chat01", slug: "001chat01"};

}


export default function ChatPage({ params } : { params: {slug: string}}){

    const { slug } = params;
    const chat = getChat(slug);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const conversationRef = useRef<HTMLDivElement>(null);
    const [visual, setVisual] = useState(SuiseiHello);
    const [promptReady, setPromptReady] = useState(true);
    const [promptValue, setPromptValue] = useState("");
    const [conversationHistory, setConversationHistory] = useState<ConversationBubble[]>([]);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(64).fill(0));

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    type ConversationBubble = {
        isSender: boolean,
        content: string,
    }

    const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if(e.key === "Enter") {
            e.preventDefault();
            handleAudioSend();
        }
    }



    const parseWav = (wavData: Uint8Array): { sampleRate: number; float32: Float32Array<ArrayBuffer> } => {
        const view = new DataView(wavData.buffer);
        const sampleRate = view.getUint32(24, true);
        const pcm16 = new Int16Array(wavData.buffer, 44);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768;
        }
        return { sampleRate, float32 };
    };

    const playWavBuffer = (
        ctx: AudioContext,
        buffer: Float32Array<ArrayBuffer>,
        sampleRate: number,
        analyzer: AnalyserNode
    ): Promise<void> => {
        return new Promise((resolve) => {
            const audioBuffer = ctx.createBuffer(1, buffer.length, sampleRate);
            audioBuffer.copyToChannel(buffer, 0);
            const src = ctx.createBufferSource();
            src.buffer = audioBuffer;
            src.connect(analyzer);
            src.onended = () => resolve();
            src.start();
        });
    };


    const handleAudioSend = async () => {
        const prompt = promptValue;

        if (prompt !== "" && prompt !== null && prompt !== undefined && promptReady) {
            setPromptReady(false);
            setPromptValue("");

            const SAMPLE_RATE = 22050;
            let visualizationTimeout: NodeJS.Timeout | null = null;

            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
                    analyzerRef.current = audioContextRef.current.createAnalyser();
                    analyzerRef.current.fftSize = 1024;
                    analyzerRef.current.connect(audioContextRef.current.destination);
                }

                if (audioContextRef.current.state === "suspended") {
                    await audioContextRef.current.resume();
                }

                const updateVisualizer = () => {
                    if (analyzerRef.current) {
                        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                        analyzerRef.current.getByteFrequencyData(dataArray);
                        setAudioData(dataArray);
                        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
                    }
                };
                updateVisualizer();

                const response = await fetch("http://localhost:8000/api/chat/voicePrompt", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to generate voice prompt: ${response.status}`);
                }

                const reader = response.body!.getReader();
                const ctx = audioContextRef.current;
                const analyzer = analyzerRef.current!;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    if (value && value.length > 44) {
                        const { sampleRate, float32 } = parseWav(value);
                        console.log(`Playing WAV: ${float32.length} samples at ${sampleRate}Hz`);
                        await playWavBuffer(ctx, float32, sampleRate, analyzer);
                        console.log("Sentence finished");
                    }
                }

                console.log("All sentences played");

                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                setAudioData(new Uint8Array(64).fill(0));

            } catch (error) {
                console.error("TTS Playback Error:", error);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                setAudioData(new Uint8Array(64).fill(0));
            }

            setPromptReady(true);
        }
    };




    const handleSend = async () => {

        const prompt = promptValue;

        if(prompt != "" && prompt != null && prompt != undefined && promptReady){

            setPromptReady(false);

            setConversationHistory((prev) => [
                ...prev,
                {
                    isSender: true,
                    content: prompt
                }
            ]);


            setPromptValue("");

            try {
                const response = await sendPrompt(prompt);

                if (!response.ok) {
                    throw new Error("Failed to send prompt");
                }

                // Add an empty message bubble for the assistant's reply
                setConversationHistory((prev) => [
                    ...prev,
                    {
                        isSender: false,
                        content: "" 
                    }
                ]);

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullReply = "";

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        fullReply += chunk;

                        // Update the last bubble in the history with the accumulated text
                        setConversationHistory((prev) => {
                            const next = [...prev];
                            const lastIndex = next.length - 1;
                            if (lastIndex >= 0 && !next[lastIndex].isSender) {
                                next[lastIndex] = { ...next[lastIndex], content: fullReply };
                            }
                            return next;
                        });
                    }
                }

                const reply = fullReply || "No comment.";
                let typingDelay = 30; // Default fallback (used for TTS sync if needed)

                // Generate and play TTS
                try {
                    // Using direct URL with a timestamp for cache busting to trigger streaming
                    const audioUrl = `/api/chat/tts?text=${encodeURIComponent(reply)}&t=${Date.now()}`;
                    const audio = new Audio(audioUrl);
                    
                    // Wait for metadata to get duration for sync
                    await new Promise((resolve) => {
                        audio.onloadedmetadata = resolve;
                        // Safety timeout if metadata fails to load quickly
                        setTimeout(resolve, 1000);
                    });

                    if (audio.duration && audio.duration !== Infinity) {
                        // Calculate delay per character to match audio duration
                        typingDelay = (audio.duration * 1000) / reply.length;
                    }

                    // Initialize Audio Context on first play
                    if (!audioContextRef.current) {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                        analyzerRef.current = audioContextRef.current.createAnalyser();
                        analyzerRef.current.fftSize = 1024; // Increased for better spectrum resolution
                        analyzerRef.current.connect(audioContextRef.current.destination);
                    }

                    if (audioContextRef.current.state === "suspended") {
                        await audioContextRef.current.resume();
                    }

                    const source = audioContextRef.current.createMediaElementSource(audio);
                    source.connect(analyzerRef.current!);

                    // Start visualization loop
                    const updateVisualizer = () => {
                        if (analyzerRef.current) {
                            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                            analyzerRef.current.getByteFrequencyData(dataArray);
                            setAudioData(dataArray);
                            animationFrameRef.current = requestAnimationFrame(updateVisualizer);
                        }
                    };

                    updateVisualizer();
                    
                    await audio.play();

                    audio.onended = () => {
                        if (animationFrameRef.current) {
                            cancelAnimationFrame(animationFrameRef.current);
                        }
                        setAudioData(new Uint8Array(64).fill(0));
                    };

                } catch (ttsError) {
                    console.error("TTS Playback Error:", ttsError);
                }



            } catch (error) {
                setPromptValue(prompt);
                console.log(error);
            }


        }

        setPromptReady(true);

    }



    useEffect(() => {

        const textarea = textareaRef.current;
        if(!textarea) return;


        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;


    }, [promptValue]);

    useEffect(() => {
        const container = conversationRef.current;
        if(container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
            });
        }

    }, [conversationHistory]);


    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setVisual(SuiseiHello);
    //     }, 1000);

    //     return () => clearTimeout(timer);

    // }, []);


    if(!chat) {
        notFound();
    }

    return(
        <>
            <div
                className="
                    flex
                    flex-col

                    items-center

                    h-screen
                    w-full

                    px-5
                    
                "
            >


                
                <div
                    className="
                        h-[25vh]
                        w-full
                        md:w-[50vw]
                        px-32

                        flex
                        flex-col
                        justify-center
                        items-center
                    "
                >

                    <AudioVisualizer 
                        audioData={audioData} 
                    />

                </div>


                {/* conversation bubbles */}
                <div
                    ref={conversationRef}
                    className="
                        h-full
                        w-full

                        md:w-[50vw]
                        

                        flex
                        flex-col
                        overflow-scroll
                        overflow-x-hidden
                        custom-scrollbar
                    "
                >
                    {
                        conversationHistory.map((msg, index) => (
                            <ChatBubble 
                                key={index}
                                isSender={msg.isSender}
                                content={msg.content}
                            />
                        ))
                    }

                </div>



                {/* chat box */}
                <div
                    className="

                        md:w-[50vw]

                        w-full
                        min-h-[50px]

                        bg-light
                        px-3
                        py-2
                        mb-5

                        flex
                        justify-between
                        items-center
                    "
                >

                    <textarea 
                        ref={textareaRef}
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        onKeyDown={handleTextAreaKeyDown}
                        placeholder="Start chatting..."
                        rows={1}
                        className="
                            w-full
                            h-full
                            max-h-[calc(1.5rem*3+1rem)]
                            resize-none
                            overflow-y-auto
                            transition-all
                            focus:outline-none
                            bg-light
                        "
                    />

                    <div
                        className={
                            promptReady ? "cursor-pointer" : "cursor-not-allowed"
                        }
                        onClick={handleAudioSend}
                    >
                        <Send 
                            size={20}
                            animateOnHover 
                            className={
                                promptReady ?
                                `
                                    text-secondary
                                `
                                :
                                `
                                    text-secondary/30
                                `
                            }
                        />
                    </div>

                </div>            


            </div>
        </>
    );

}