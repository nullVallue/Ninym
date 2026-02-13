/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_REST_URL = process.env.REST_API_URL;
if(BASE_REST_URL == null){
    throw new Error("Please define REST_API_URL in environment variables!");
}




type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface HttpHeaders {
    // "Content-Type": string
    // "Access-Control-Allow-Origin": string
    // "Access-Control-Allow-Methods": string
    // "Access-Control-Allow-Headers": string
    [key: string]: string
}

const defaultHeaders : HttpHeaders = {
    "Content-Type": "application/json;charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT",
    "Access-Control-Allow-Headers": "Content-Type",
};

interface ApiResponse<T = unknown>{
    status?: string,
    message?: string,
    data?: T,
}

class HTTPClient {
    private baseUrl: string;
    private headers: HttpHeaders;

    constructor(url : string = BASE_REST_URL??"", headers?: {[key:string]:string}, overrideHeaders? : {[key:string]:string}){
        if(headers != undefined && overrideHeaders != undefined){
            throw new Error("Only one of 'headers' or 'overrideHeaders' allowed, >= 1 detected");
        }


        this.baseUrl = url;
        let newHeader = defaultHeaders;


        if(headers){
            if(headers["Content-Type"]){
                newHeader["Content-Type"] = headers["Content-Type"]
            }

            if(headers["Access-Control-Allow-Origin"]){
                newHeader["Access-Control-Allow-Origin"] = headers["Access-Control-Allow-Origin"]
            }

            if(headers["Access-Control-Allow-Methods"]){
                newHeader["Access-Control-Allow-Methods"] = headers["Access-Control-Allow-Methods"]
            }
            
            if(headers["Access-Control-Allow-Headers"]){
                newHeader["Access-Control-Allow-Headers"] = headers["Access-Control-Allow-Headers"]
            }
        }
        else if(overrideHeaders){
            newHeader = overrideHeaders;
        }

        this.headers = newHeader;



    }


    private async request (
        method: HttpMethod,
        uri: string,
        body?: object,
    ) {

        try{

            const url = this.baseUrl + uri;
            const options: RequestInit = {
                method,
                headers: this.headers,
                body: body ? JSON.stringify(body) : undefined,
            }

            const response = await fetch(url, options);
            const json = await response.json();

            if(!response.ok) {
                throw new Error(json.error || "Request failed");
            }
            
            return json

        } catch(e) {
            return {
                error: e instanceof Error ? e.message : "An unknown error occured",
                message: "Request failed",
            }
        }
    }

    async get(uri: string) { 
        return await this.request("GET", uri);
    }

    async post(uri: string, body?: object) { 
        return await this.request("POST", uri, body);
    }

    async put(uri: string, body?: object) {
        return await this.request("PUT", uri, body);
    }

    async delete<T>(uri: string, body?: object): Promise<T> {
        return await this.request("DELETE", uri, body);
    }

    setHeaders(headers: {[key:string]:string}){
        this.headers = {...defaultHeaders, ...headers}
    }

}

// for internal api use, (api's hosted by the env var url) 
async function httpGet(uri: string){
    const client = new HTTPClient();
    return await client.get(uri);
}

async function httpPost(uri: string, body: object){
    const client = new HTTPClient();
    return await client.post(uri, body);
}

async function httpPut(uri: string, body: object){
    const client = new HTTPClient();
    return await client.put(uri, body);
}

async function httpDelete(uri: string, body: object){
    const client = new HTTPClient();
    return await client.delete(uri, body);
}

function parseParams(params:{[key:string]:string|number}):string{

    return Object.entries(params).map(
        (keyValuePair) => {
            return `${keyValuePair[0]}=${keyValuePair[1].toString()}`;
        }
    ).join('&');

}

// async function externalRequest(method: HttpMethod, url : string, uri : string, headers? : {[key:string]:string}, body?: object){
//     const client = new HTTPClient(url);

//     switch(method){
//         case "GET":
//             return await client.get(uri);
//         case 'POST':
//             return await client.post(uri, body);
//         case 'PUT':
//             return await client.put(uri, body);
//         case 'DELETE':
//             return await client.delete(uri, body);
//         default:
//             return {}
//     }

// }

async function externalRequest({
    method, 
    url, 
    uri, 
    headers, 
    overrideHeaders,
    body, 
    params,
} : 
{
    method: HttpMethod;
    url: string;
    uri: string;
    headers? : { [key:string] : string };
    overrideHeaders? : { [key:string] : string };
    body? : object,
    params? : { [key:string] : string | number}
}
) {

    const client = new HTTPClient(url, headers??undefined, overrideHeaders??undefined);

    if(params){
        uri = uri.concat('?');
        uri = uri.concat(parseParams(params));
    }

    switch(method){
        case "GET":
            return await client.get(uri);
        case 'POST':
            return await client.post(uri, body);
        case 'PUT':
            return await client.put(uri, body);
        case 'DELETE':
            return await client.delete(uri, body);
        default:
            return {}
    }

}

export { 
    externalRequest,
    httpGet,
    httpPost,
    httpPut,
    httpDelete,
}