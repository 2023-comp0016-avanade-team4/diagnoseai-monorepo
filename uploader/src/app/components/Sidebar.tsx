"use client";

import Image from "next/image";
import uploadsvg from "../../../public/upload.svg";
import checkcirclesvg from "../../../public/check-circle.svg";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Accordion, AccordionItem } from "@nextui-org/react";
import "./sidebar.css";

export const ACTIVE_CLASSES =
  "bg-white flex flex-row items-center justify-start gap-2 text-darkslategray-300 p-5 border border-2 border-blue-500 p-4 overflow-hidden";
export const INACTIVE_CLASSES =
  "bg-slate-400 flex flex-row items-center justify-start gap-2 text-darkslategray-300 p-5 overflow-hidden";

export const getStylesForNavItem = (
  expectedPath: string,
  currentPath: string,
) => {
  const isSamePath = expectedPath == currentPath;
  return isSamePath ? ACTIVE_CLASSES : INACTIVE_CLASSES;
};

const Sidebar = () => {
  let path = usePathname();
  if (!path) {
    path = "";
  }

  return (
    <div className="flex-shrink-0 bg-slate-100 text-black w-72 p-4 flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h2 className="text-2xl text-center font-bold">Stages</h2>
        </div>
        <ul>
          <li className="mb-2">
            <div className={getStylesForNavItem("/", path)}>
              <Image className="w-5 h-5" alt="Upload Icon" src={uploadsvg} />
              <div className="inline-block shrink-0">Upload File</div>
            </div>
          </li>

          <li className="mb-2">
            <div className={getStylesForNavItem("/validate", path)}>
              <Image className="w-5 h-5" alt="Validate" src={checkcirclesvg} />
              <div className="inline-block shrink-0">Validate</div>
            </div>
          </li>
        </ul>
      </div>
      <Accordion>
        <AccordionItem key="1" aria-label="Dev Links" title="Dev Links">
          <div className="center devlinks">
            <Link href="/machines/create">Create Machine</Link>
            <Link href="/machines/delete">Delete Machine</Link>
            <Link href="/workorder/create">Create Work Order</Link>
            <Link href="/workorder/delete">Delete Work Order</Link>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
