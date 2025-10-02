"use client";

import { useEffect } from "react";
import { setInvitationTokenAction } from "@/lib/invitation/actions";

interface InvitationTokenSetterProps {
  token: string;
}

export function InvitationTokenSetter({ token }: InvitationTokenSetterProps) {
  useEffect(() => {
    // Set cookie via Server Action
    setInvitationTokenAction(token);
  }, [token]);

  return null; // This component doesn't render anything
}