import { useState } from "react";
import useSound from "use-sound";

export type AddNewMessageRequest = {
  username: string,
  avatar?: string | null,
  body: string
};

export const NewMessageForm = () => {
  const [play] = useSound("sent.wav");
  const [body, setBody] = useState("");
  const addNewMessage = (accepting: AddNewMessageRequest) => {
    console.log(accepting);
    play();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (body) {
          addNewMessage({
            username: "some_user",
            avatar: 'https://avatars.githubusercontent.com/u/1856293?v=4',
            body,
          });
          setBody("");
        }
      }}
      className="flex items-center space-x-3"
    >
      <input
        autoFocus
        id="message"
        name="message"
        placeholder="Write a message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 h-12 px-3 rounded bg-[#222226] border border-[#222226] focus:border-[#222226] focus:outline-none text-white placeholder-white"
      />
      <button
        type="submit"
        className="bg-[#222226] rounded h-12 font-medium text-white w-24 text-lg border border-transparent hover:bg-[#363739] transition"
        disabled={!body}
      >
        Send
      </button>
    </form >
  );
};
