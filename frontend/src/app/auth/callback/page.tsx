"use client";

import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function finishSignIn() {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          await getCurrentUser();

          if (isMounted) {
            router.replace("/");
          }

          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      if (isMounted) {
        router.replace("/");
      }
    }

    finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>Finishing sign in...</p>
    </main>
  );
}