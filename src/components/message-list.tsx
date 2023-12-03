import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

// import { Message as IMessage } from "@/components/message";
import { Message } from "@/components/message";

// const GetRecentMessagesQuery = gql`
//   query GetRecentMessages($last: Int) @live {
//     messageCollection(last: $last) {
//       edges {
//         node {
//           id
//           username
//           avatar
//           body
//           likes
//           createdAt
//         }
//       }
//     }
//   }
// `;

export const MessageList = () => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });

  // const { loading, error, data } = useQuery<{
  //   messageCollection: { edges: { node: IMessage }[] };
  // }>(GetRecentMessagesQuery, {
  //   variables: {
  //     last: 100,
  //   },
  // });
  const data = {
    messageCollection: {
      edges:
        [
          {
            node: {
              id: 'msg_id_1',
              username: 'some_user',
              avatar: 'https://avatars.githubusercontent.com/u/1856293?v=4',
              body: 'hello world',
              createdAt: '2023-12-03T20:02:05.686Z'
            }
          },
          {
            node: {
              id: 'msg_id_2',
              username: 'the_bot',
              avatar: 'https://avatars.githubusercontent.com/u/114498077?v=4',
              body: 'yo',
              createdAt: '2023-12-03T20:02:05.686Z'
            }
          }
        ]
    }
  }

  useEffect(() => {
    if (entry?.target) {
      entry.target.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [data?.messageCollection.edges.length, entry?.target]);

  if (false)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white">Fetching most recent chat messages.</p>
      </div>
    );

  if (false)
    return (
      <p className="text-white">Something went wrong. Refresh to try again.</p>
    );

  return (
    <div className="flex flex-col w-full space-y-3 overflow-y-scroll no-scrollbar">
      {!inView && data?.messageCollection.edges.length && (
        <div className="py-1.5 w-full px-3 z-10 text-xs absolute flex justify-center bottom-0 mb-[120px] inset-x-0">
          <button
            className="py-1.5 px-3 text-xs bg-[#1c1c1f] border border-[#363739] rounded-full text-white font-medium"
            onClick={() => {
              entry?.target.scrollIntoView({ behavior: "smooth", block: "end" })
            }}
          >
            Scroll to see latest messages
          </button>
        </div>
      )}
      {data?.messageCollection?.edges?.map(({ node }) => (
        <Message key={node?.id} message={node} />
      ))}
      <div ref={scrollRef} />
    </div>
  );
};
