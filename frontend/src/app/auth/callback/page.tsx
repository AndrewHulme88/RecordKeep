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

    // Amplify may need a moment to exchange the Cognito
    // authorisation code and make the authenticated session available
    const interval = window.setInterval(async () => {
      attempts++;

      try {
        await getCurrentUser();

        // Stop polling once the session is available and return the 
        // user to the dashboard
        window.clearInterval(interval);

        router.replace("/");
        router.refresh();
      } catch {
        // Stop retrying after five seconds and let the user continue manually
        if (attempts >= maximumAttempts) {
          window.clearInterval(interval);
          setError("Sign-in completed, but the redirect could not finish.");
        }
      }
    }, 250);

    // Prevent the interval from continuing if the component unmounts
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