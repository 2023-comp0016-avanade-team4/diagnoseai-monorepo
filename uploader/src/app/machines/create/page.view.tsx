"use client";
import React from "react";
import { Input, Button } from "@nextui-org/react";

export interface PageViewProps {
  manufacturer: string;
  model: string;
  response: string;
  handleSubmit: ((e: any) => void) | undefined;
  setManufacturer: ((e: any) => void) | undefined;
  setModel: ((e: any) => void) | undefined;
}

// No need to unit test; view-only
export const PageView = ({
  manufacturer,
  model,
  response,
  handleSubmit,
  setManufacturer,
  setModel,
}: PageViewProps) => (
  <div className="w-100 h-100 text-center m-5">
    <h1 className="text-4xl py-5">Create a new machine</h1>
    <form
      className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center"
      onSubmit={handleSubmit}
    >
      <Input
        type="text"
        value={manufacturer}
        onChange={(e) => setManufacturer?.(e.target.value)}
        isRequired
        placeholder="Enter a manufacturer"
      />
      <Input
        type="text"
        value={model}
        isRequired
        onChange={(e) => setModel?.(e.target.value)}
        placeholder="Enter a model"
      />
      <Button color="primary" type="submit">
        Submit
      </Button>
    </form>
    <div>{response}</div>
  </div>
);
