import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { MessageList } from "@/components/message-list";
import { NewMessageForm } from "@/components/new-message-form";
import { FixedSideMenu } from "@/components/fixed-side-menu";
import { isGreaterThanBreakpoint } from "@/utils/useBreakpoint";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Side menu is only closed by default on mobile
    // If we detect that we're actually on desktop, open the side menu by default
    if (isGreaterThanBreakpoint("md")) {
      setIsOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-row">
      <FixedSideMenu className="hidden md:block" isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex flex-col bg-cover dark w-full relative">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />
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
    </div>
  );
}
