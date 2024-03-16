import { Header } from "@/components/header";
import { MessageList } from "@/components/message-list";
import { NewMessageForm } from "@/components/new-message-form";

export default function Home() {
  return (
    <div className="flex flex-col bg-cover dark">
      <Header />
      <div className="flex-1 overflow-y-scroll no-scrollbar p-6">
        <div className="max-w-4xl mx-auto h-full">
          <div className="flex justify-between items-center h-full">
            <MessageList />
          </div>
        </div>
      </div>
      <div className="p-6 bg-white/5 border-t border-[#363739]">
        <div className="max-w-4xl mx-auto">
          <NewMessageForm />
        </div>
      </div>
    </div>
  );
}
