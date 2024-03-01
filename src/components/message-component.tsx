// import { formatRelative, formatDistance, differenceInHours } from "date-fns";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export type Message = {
  id: string;
  username: string;
  message: string;
  sentAt: number;
  isImage?: boolean;
  authToken?: string;
};

interface Props {
  message: Message;
}

export const MessageComponent = ({ message }: Props) => {
  const { user } = useUser();
  // TODO: Eventually, we should be checking User ID.
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
        {user?.imageUrl && message.username === "some_user" && (
          <div className="w-12 h-12 overflow-hidden flex-shrink-0 rounded">
            <a
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                width={50}
                height={50}
                src={user?.imageUrl}
                alt={message.username}
                title={message.username}
              />
            </a>
          </div>
        )}
        <span
          className={`inline-flex rounded space-x-2 items-start p-3 text-white ${message.username === "some_user" ? "bg-[#4a9c6d]" : "bg-[#363739]"
            } `}
        >
          {message.username !== "some_user" && (
            <span className="font-bold">{message.username}:&nbsp;</span>
          )}
          {message.isImage ? (
            <Image
              className="w-[300px] h-auto"
              alt={`Image uploaded by ${message.username}`}
              src={message.message}
              width={0}
              height={0}
            />
          ) : (
            <span className="max-w-sm">{message.message}</span>
          )}
        </span>
      </div>
      {/* <p className="text-xs text-white/50">
        {differenceInHours(new Date(), new Date(message.createdAt)) >= 1
          ? formatRelative(new Date(message.createdAt), new Date())
          : formatDistance(new Date(message.createdAt), new Date(), {
            addSuffix: true,
          })}
      </p> */}
    </div>
  );
};
