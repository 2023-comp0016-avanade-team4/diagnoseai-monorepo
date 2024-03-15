import Image from "next/image";

export type Message = {
  id: string;
  username: string;
  body: string;
  createdAt: string;
};

interface Props {
  message: Message;
}

const MessageComponent = ({ message }: Props) => {

  return (
    <div
      className={`flex flex-col relative space-x-1 space-y-1 ${message.username === "some_user" ? "text-right" : "text-left"
        }`}
    >
      <div
        className={`flex relative space-x-1 ${message.username === "some_user"
          ? "flex-row-reverse space-x-reverse"
          : "flex-row"
          }`}
      >
        <span
          className={`inline-flex rounded space-x-2 items-start p-3 ${message.username === "some_user"
            ? "bg-[#4a9c6d]"
            : "bg-slate-400"
            } `}
        >
          <span className="max-w-sm">{message.body}</span>
        </span>
      </div>
    </div>
  );
};

export default MessageComponent;
