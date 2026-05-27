"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SafetyBriefModalProps {
  open: boolean;
}

export default function SafetyBriefModal({ open }: SafetyBriefModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const onAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/safety-brief", { method: "POST" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-neutral-950 text-neutral-100 border-neutral-800">
        <DialogHeader>
          <DialogTitle>Before You Begin</DialogTitle>
          <DialogDescription className="text-neutral-300">
            HushHour is not therapy. For emergencies, contact 988 or your campus
            counseling center.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-neutral-200">
          <li>1. HushHour is not therapy.</li>
          <li>2. For crisis: 988 or campus counseling.</li>
          <li>3. Be kind. No contact info exchange.</li>
          <li>4. Messages are AI-moderated for safety.</li>
        </ul>

        <DialogFooter>
          <Button disabled={isSubmitting} onClick={onAcknowledge}>
            {isSubmitting ? "Starting..." : "Tap to begin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
