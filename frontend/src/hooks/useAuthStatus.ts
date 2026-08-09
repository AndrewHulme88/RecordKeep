"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export function useAuthStatus() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthState() {
      try {
        await getCurrentUser();
        if (isMounted) setIsSignedIn(true);
      } catch {
        if (isMounted) setIsSignedIn(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadAuthState();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        setIsSignedIn(true);
        setIsLoading(false);
      }

      if (payload.event === "signedOut") {
        setIsSignedIn(false);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { isSignedIn, isLoading };
}
