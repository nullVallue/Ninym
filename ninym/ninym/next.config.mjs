/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    env: {
        REST_API_URL: "http://localhost:3000",
        NEXT_PUBLIC_PROMPT_API_URL: "http://localhost:8000/api/chat/prompt",
    }


};

export default nextConfig;
