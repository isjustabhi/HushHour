"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TapButton from "@/components/TapButton";
import RoleChoice from "@/components/RoleChoice";
import VibeTagPicker from "@/components/VibeTagPicker";
import CrisisLink from "@/components/CrisisLink";
import { trackEvent } from "@/lib/analytics";

type Role = "seeker" | "listener";

export default function LandingPanel() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("seeker");
  const [vibeTag, setVibeTag] = useState<string | null>(null);

  const startFlow = () => {
    trackEvent("button_tapped", { role });
    const params = new URLSearchParams();
    params.set("role", role);
    if (vibeTag) {
      params.set("vibe", vibeTag.replace(/\s+/g, "_"));
    }
    router.push(`/lobby?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <TapButton onClick={startFlow} />
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm text-[var(--hush-muted)]">
          Choose your role
        </p>
        <RoleChoice value={role} onChange={setRole} />
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm text-[var(--hush-muted)]">
          What&apos;s on your mind? (optional)
        </p>
        <VibeTagPicker value={vibeTag} onChange={setVibeTag} />
      </div>

      <div className="space-y-2 text-center">
        <CrisisLink />
        <p className="text-xs text-[var(--hush-muted)]">
          HushHour isn&apos;t therapy. For emergencies: 988.
        </p>
      </div>
    </div>
  );
}
