"use client";
import { Button } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import ImageCarousel from "../components/ImageCarousel";
import Chat from "../components/Chat";
import { useAppSelector } from "../../redux/hook";
import { selectMachineById } from "../../redux/reducers/selectedMachineReducer";
import { RootState } from "../../redux/store";
import { useRouter, useSearchParams } from "next/navigation";
import MachineList from "../components/machinesList";

const Validate = () => {
  const fillerDivRef = useRef<HTMLDivElement>(null);
  const [divHeight, setDivHeight] = useState(0);
  const [divWidth, setDivWidth] = useState(0);
  // TODO: whoever is doing the backend, use setImages
  const [images, setImages] = useState<string[]>([
    "https://atlas-content-cdn.pixelsquid.com/stock-images/gas-boiler-Od6zKJ0-600.jpg",
    "https://atlas-content-cdn.pixelsquid.com/stock-images/thermex-boiler-n1Pm244-600.jpg",
    "https://banner2.cleanpng.com/20180526/hst/kisspng-electric-boiler-industry-manufacturing-5b09a14f01b6b3.840125911527357775007.jpg",
  ]);

  // TODO: whoever is doing the backend, use setExtractedText
  const [extractedText, setExtractedText] = useState<string>(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eu suscipit diam. Ut vitae varius mauris, a pharetra erat. Suspendisse tempus eget orci vitae euismod. Fusce lacinia velit quam, quis sollicitudin urna sagittis et. Integer in lacus ac turpis fermentum interdum id mattis lacus. Praesent at condimentum tellus. Nunc dignissim neque id dui blandit consectetur. In at ultricies mi. Aliquam id risus ac elit consectetur porttitor eu at lacus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Pellentesque aliquam dui et laoreet porttitor. Proin tempor enim eu tortor laoreet, vitae pretium augue interdum.",
  );
  const router = useRouter();
  const { machines, selectedMachine } = useAppSelector((state: RootState) => ({
    machines: state.machines,
    selectedMachine: state.selectedMachine,
  }));
  const params = useSearchParams();
  const index = params?.get("index");
  const machine = params?.get("machine");

  useEffect(() => {
    if (index === null || machine === null || index === "" || machine === "") {
      router.replace("/?");
      return;
    }
    selectMachineById(machines, machine as string);
  }, [router, index, machine, machines]);

  // HACK (?): Not sure if this counts as a hack, since this was the only way I had to do this.,
  // Handles the resizing of the image carousel
  useEffect(() => {
    // TODO: whoever is doing the backend, please check that all the
    // validation data is present before proceeding

    const handleResize = () => {
      setDivHeight(0);
      setDivWidth(0);
      setTimeout(() => {
        setDivHeight(fillerDivRef.current?.clientHeight || 0);
        setDivWidth(fillerDivRef.current?.clientWidth || 0);
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setDivHeight(fillerDivRef.current?.clientHeight || 0);
    setDivWidth(fillerDivRef.current?.clientWidth || 0);
  }, [fillerDivRef]);

  useEffect(() => {
    const searchIndex = params?.get("index") || "";
    fetch(`/api/indexContent?searchIndex=${searchIndex}`, {
      method: "GET",
    }).then((response) => {
      response.json().then((data) => {
        setExtractedText(data.results.join("\n"));
      });
    });
  });

  return (
    <div className="flex h-full max-h-full">
      <div className="flex-1 max-h-full">
        <div className="p-4 bg-gray-200 h-full flex">
          <div className="grid grid-cols-1 grid-rows-[auto,1fr,1fr,auto] w-full max-h-full">
            <h2 className="py-2 text-xl text-center font-extrabold">
              Validate
            </h2>
            <div className="bg-slate-100 flex-1 flex flex-col">
              <h3 className="p-3 text-md font-bold flex-0">Selected Machine</h3>
              <div className="m-3 bg-slate-200 rounded p-4 overflow-y-auto">
                <MachineList />
              </div >
              <h3 className="p-3 text-md font-bold flex-0">Extracted Images</h3>
              <div ref={fillerDivRef} className="flex-1">
                <ImageCarousel
                  images={images}
                  height={divHeight}
                  width={divWidth}
                />
              </div>
            </div >
            <div className="bg-slate-100 flex-1 flex flex-col overflow-y-auto">
              <h3 className="p-3 text-md font-bold flex-0">Extracted text</h3>
              <div className="m-3 bg-slate-200 rounded p-4 overflow-y-auto">
                <p>{extractedText}</p>
              </div>
            </div>
            <Button
              className="my-3 max-w-xs flex-0 place-self-center"
              color="primary"
            >
              Confirm Validation
            </Button>
          </div >
        </div >
      </div >

      <div className="flex-shrink-0 w-4/12">
        <div className="p-4 bg-gray-300 h-full flex flex-col">
          <h2 className="py-2 text-xl text-center font-extrabold">Chat</h2>
          <div className="flex-1">
            <Chat />
          </div>
        </div>
      </div>
    </div >
  );
};

export default Validate;
