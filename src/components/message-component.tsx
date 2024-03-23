// import { formatRelative, formatDistance, differenceInHours } from "date-fns";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import BotImg from "../../assets/bot.png";
import { User } from "@clerk/nextjs/dist/types/server";

export type citationObject = {
  filepath: string;
};

export type Message = {
  id: string;
  username: string;
  message: string;
  sentAt: number;
  citations: citationObject[];
  isImage?: boolean;
  authToken?: string;
};

interface Props {
  userPicture?: string;
  message: Message;
}

export const MessageComponent = ({ userPicture, message }: Props) => {
  // TODO: Eventually, we should be checking User ID.
  const [messageBody, setMessageBody] = useState<React.ReactNode>(<></>);

  useEffect(() => {
    let tempMessageBody: React.ReactNode = <></>;
    let messageText = message.message;
    if (message.citations?.length > 0) {
      while (messageText.length > 0) {
        const startIndex = messageText.indexOf("[doc"); // find the first citation
        if (startIndex === 0) {
          const endIndex = messageText.indexOf("]");
          const citationIndex = messageText.substring(startIndex + 4, endIndex);
          const citation = message.citations[parseInt(citationIndex) - 1];
          const hyperLink = (
            <a
              href={citation.filepath}
              style={{ color: "#8cb4ff", textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              [doc{citationIndex}]
            </a>
          );
          tempMessageBody = (
            <>
              {tempMessageBody}
              {hyperLink}
            </>
          );
          messageText = messageText.substring(endIndex + 1);
        } else if (startIndex === -1) {
          tempMessageBody = (
            <>
              {tempMessageBody}
              {messageText}
            </>
          );
          break;
        } else {
          tempMessageBody = (
            <>
              {tempMessageBody}
              {messageText.substring(0, startIndex)}
            </>
          );
          messageText = messageText.substring(startIndex);
        }
      }
    } else {
      tempMessageBody = message.message;
    }
    setMessageBody(tempMessageBody);
  }, [message]);

  return (
    <div
      className={`flex flex-col relative space-x-1 space-y-1 ${message.username !== "bot" ? "text-right" : "text-left"
        }`}
    >
      <div
        className={`flex relative space-x-1 ${message.username !== "bot"
          ? "flex-row-reverse space-x-reverse"
          : "flex-row"
          }`}
      >
        {userPicture && message.username !== "bot" && (
          <div className="w-12 h-12 overflow-hidden flex-shrink-0 rounded">
            <a target="_blank" rel="noopener noreferrer">
              <Image
                width={50}
                height={50}
                src={userPicture}
                alt={message.username}
              />
            </a>
          </div>
        )}
        {message.username === "bot" && (
          <div className="w-12 h-12 overflow-hidden flex-shrink-0 rounded">
            <a target="_blank" rel="noopener noreferrer">
              <Image width={50} height={50} src={BotImg} alt="Bot" />
            </a>
          </div>
        )}
        <span
          className={`inline-flex rounded space-x-2 items-start p-3 text-white ${message.username !== "bot" ? "bg-[#4a9c6d]" : "bg-[#363739]"
            } `}
        >
          {message.isImage ? (
            <Image
              className="w-[300px] h-auto"
              alt={`Image uploaded by ${message.username}`}
              src={message.message}
              width={0}
              height={0}
            />
          ) : (
            <span className="max-w-sm">{messageBody}</span>
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
