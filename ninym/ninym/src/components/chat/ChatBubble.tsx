

export default function ChatBubble({isSender, content} : 
    {
        isSender: boolean,
        content: string,
    })
    {



    if(isSender){
        return (
            <div
                className="
                    w-full
                    flex
                    justify-end
                    py-3
                "
            >
                <div
                    className="
                        bg-secondary
                        py-3
                        px-5
                        text-light
                    "
                >
                    {content}
                </div>
            </div>
        )
    }
    else{
        return (
            <div
                className="
                    w-full
                    flex
                    justify-start
                    py-3
                "
            >
                <div
                    className="
                        bg-accent-secondary
                        py-3
                        px-5
                        text-light
                    "
                >
                    {content}
                </div>
            </div>
        )
    }


}