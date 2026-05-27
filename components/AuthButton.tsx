"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export default function AuthButton({ isAuthenticated }: AuthButtonProps) {
  if (isAuthenticated) {
    return <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>;
  }

  return <Button onClick={() => signIn(undefined, { callbackUrl: "/" })}>Sign in</Button>;
}
