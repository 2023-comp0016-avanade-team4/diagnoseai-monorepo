"use client";

import { useRef } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "../redux/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <NextUIProvider className="h-full">
            <Provider store={storeRef.current}>
                    {children}
            </Provider>
    </NextUIProvider>
  );
}
