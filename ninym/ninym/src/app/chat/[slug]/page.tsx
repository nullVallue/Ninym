import { notFound } from "next/navigation";
import eyes from "../../../assets/chat/NinymEyes.gif"

type Chat = {
    id: string
    name: string
    slug: string
}

async function getChat(slug: string){
    return {id: "001", name: "chat01", slug: "001chat01"};

}


export default async function ChatPage({ params } : { params: {slug: string}}){

    const { slug } = params;
    const chat = await getChat(slug);

    if(!chat) {
        notFound();
    }

    return(
        <>
            <div
                className="
                    flex
                    justify-center
                    items-center

                    h-screen
                    w-full
                "
            >

                <img
                    src={eyes.src}
                    className="
                        h-[30vh]
                        object-contain
                    "
                />


            </div>
        </>
    );

}