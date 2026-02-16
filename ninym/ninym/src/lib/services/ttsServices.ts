import { httpPost } from "../helpers/http/httpClient";


export async function getTts(
    text: string
){
    return await httpPost("api/chat/tts", {
        text: text,
    });
}