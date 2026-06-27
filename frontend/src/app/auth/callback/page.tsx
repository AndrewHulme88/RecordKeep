"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let attempts = 0;
    const maximumAttempts = 20;

    const interval = window.setInterval(async () => {
      attempts++;

      try {
        await getCurrentUser();

        window.clearInterval(interval);

        router.replace("/");
        router.refresh();
      } catch {
        if (attempts >= maximumAttempts) {
          window.clearInterval(interval);
          setError("Sign-in completed, but the redirect could not finish.");
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Continue to RecordKeep
            </button>
          </>
        ) : (
          <p className="text-gray-600">Signing you in...</p>
        )}
      </div>
    </main>
  );
}