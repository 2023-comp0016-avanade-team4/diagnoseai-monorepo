"use client";
import { useState } from "react";
import { PageViewProps } from "./page.view";
import { createMachine } from "@/apis";

export const ViewController = ({ View }: { View: React.FC<PageViewProps> }) => {
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!manufacturer || !model) {
      setResponse("Please fill out all fields");
      return;
    }

    const res = await createMachine(manufacturer, model);
    setResponse(res.data.message);
    setModel("");
    setManufacturer("");
  };

  return (
    <View
      manufacturer={manufacturer}
      model={model}
      response={response}
      handleSubmit={handleSubmit}
      setManufacturer={setManufacturer}
      setModel={setModel}
    />
  );
};
