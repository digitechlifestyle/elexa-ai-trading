"use client";

import { useEffect, useRef } from "react";

export default function EconomicCalendar({
  height = 600,
  theme = "dark",
}: {
  height?: number;
  theme?: "light" | "dark";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = `${height}px`;
    inner.style.width = "100%";
    containerRef.current.appendChild(inner);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: false,
      width: "100%",
      height,
      locale: "en",
      importanceFilter: "0,1",
      countryFilter: "us,gb,eu,jp,cn,ca",
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [height, theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ height }}
    />
  );
}
