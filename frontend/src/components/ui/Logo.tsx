"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  height?: number;
  width?: number;
  showText?: boolean;
}

export function Logo({ className = "", height = 36, width = 160, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Support AI"
          width={width}
          height={height}
          priority
          className="object-contain h-auto max-h-[44px] w-auto"
        />
      </div>
    </div>
  );
}

export function LogoIcon({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Support AI"
        width={size * 3}
        height={size}
        priority
        className="object-contain max-h-[36px] w-auto"
      />
    </div>
  );
}
