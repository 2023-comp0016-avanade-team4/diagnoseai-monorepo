"use client";

import React, { useState, useEffect } from "react";

export function BlockSmallWidth({ children }: { children: React.ReactNode }) {
  // The uploader UI is not designed to be responsive.
  // Instead of breaking the UI, we just tell the user we can't handle it
  const [isTooSmall, setIsTooSmall] = useState(false);
  const handleResize = () => {
    if (window.innerWidth < 670) {
      setIsTooSmall(true);
      return;
    }
    setIsTooSmall(false);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return <>{isTooSmall ? <div>Device too small.</div> : children}</>;
}
