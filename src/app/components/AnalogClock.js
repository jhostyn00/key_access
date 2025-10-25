"use client";

import { useEffect, useState } from "react";

export default function AnalogClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true); // activamos render solo en cliente
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null; // no renderizar en SSR

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="w-40 h-40 rounded-full bg-transparent relative flex items-center justify-center shadow-lg">
      <div className="absolute w-2 h-2 bg-white rounded-full z-10"></div>

      {/* Hora */}
      <div
        className="absolute bg-white w-1 h-10 rounded origin-bottom left-1/2 bottom-1/2"
        style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
      ></div>

      {/* Minuto */}
      <div
        className="absolute bg-white w-1 h-14 rounded origin-bottom left-1/2 bottom-1/2"
        style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
      ></div>

      {/* Segundo */}
      <div
        className="absolute bg-[#b3ae83] w-0.5 h-16 rounded origin-bottom left-1/2 bottom-1/2"
        style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
      ></div>
    </div>
  );
}
