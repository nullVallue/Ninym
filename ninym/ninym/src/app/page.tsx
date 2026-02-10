import ChatPage from "./chat/[slug]/page";

export default function Home() {
  return (
    <>

      <ChatPage params={{slug: "001chat01"}} />

    </>
  );
}
