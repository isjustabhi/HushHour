"use client";

interface MessageBubbleProps {
  body: string;
  isMine: boolean;
}

export default function MessageBubble({ body, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-relaxed"
        style={{
          backgroundColor: isMine ? "var(--hush-you)" : "var(--hush-them)",
          color: "#171717",
        }}
      >
        {body}
      </div>
    </div>
  );
}
