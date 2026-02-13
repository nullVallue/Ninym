"use client"

import { notFound } from "next/navigation";
import visual from "../../../assets/chat/SuiseiHello.png"
import SuiseiHello from "../../../assets/chat/SuiseiHello.png"
import SuiseiEyes from "../../../assets/chat/SuiseiEyes.gif"
import { useEffect, useRef, useState } from "react";
import { Send } from "@/components/animate-ui/icons/send";
import { sendPrompt } from "@/lib/services/chatServices";
import ChatBubble from "@/components/chat/ChatBubble";

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
    const [visual, setVisual] = useState(SuiseiHello);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [promptValue, setPromptValue] = useState("");

    type ConversationBubble = {
        isSender: boolean,
        content: string,
    }

    const [conversationHistory, setConversationHistory] = useState<ConversationBubble[]>([]);


    const handleSend = async () => {

        const prompt = promptValue;

        if(prompt != "" && prompt != null && prompt != undefined){


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


                if(!response.success){
                    throw new Error("Failed to send prompt");
                }

                const reply = response.message?.message?.content ?? "No comment.";

                setConversationHistory((prev) => [
                    ...prev,
                    {
                        isSender: false,
                        content: reply 
                    }
                ]);


            } catch (error) {
                setPromptValue(prompt);
                console.log(error);
            }


        }

    }



    useEffect(() => {

        const textarea = textareaRef.current;
        if(!textarea) return;


        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;


    }, [promptValue]);


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

                {/* conversation bubbles */}
                <div
                    className="
                        h-full
                        w-full

                        flex
                        flex-col
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
                        className="
                            cursor-pointer
                        "
                        onClick={handleSend}
                    >
                        <Send 
                            size={20}
                            animateOnHover 
                            className="
                                text-secondary
                            "
                        />
                    </div>

                </div>            


            </div>
        </>
    );

}