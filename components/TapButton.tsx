"use client";

import { Button } from "@/components/ui/button";

interface TapButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function TapButton({ onClick, disabled }: TapButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[200px] w-[200px] rounded-full border border-white/10 text-lg font-medium text-black transition-all duration-300 hover:scale-[1.015] disabled:opacity-50"
      style={{
        backgroundColor: "var(--hush-accent)",
        boxShadow: "0 0 36px rgba(255, 181, 138, 0.28)",
      }}
    >
      I want to talk
    </Button>
  );
}
