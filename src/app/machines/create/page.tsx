"use client";
import { useState } from "react";
import axios from "axios";

import { Input, Button } from "@nextui-org/react";

const Page = () => {
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manufacturer || !model) {
      setResponse("Please fill out all fields");
      return;
    }

    const res = await axios.post('/api/createMachine', {
      manufacturer,
      model
    });
    setResponse(res.data.message);
  };

  return (
    <div className="w-100 h-100 text-center m-5">
      <h1 className="text-4xl py-5">Create a new machine</h1>
      <form className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center" onSubmit={handleSubmit}>
        <Input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          isRequired
          placeholder="Enter a manufacturer"
        />
        <Input
          type="text"
          value={model}
          isRequired
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter a model"
        />
        <Button color="primary" type="submit">Submit</Button>
      </form>
      <div>{response}</div>
    </div >
  );
};

export default Page;
