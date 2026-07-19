"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signInWithRedirect, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export default function AuthControls() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadAuthState() {
            try {
                await getCurrentUser();

                if (isMounted) {
                    setIsSignedIn(true);
                }
            } catch {
                if (isMounted) {
                    setIsSignedIn(false);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadAuthState();

        // Keep the button in sync when Amplify reports sign-in or sign-out events
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

    async function handleSignIn() {
        await signInWithRedirect();
    }

    async function handleSignOut() {
        try {
            await signOut();
        } catch (error) {
            console.error("Sign-out failed:", error);
        }
    }

    if (isLoading) {
        return null;
    }

    return isSignedIn ? (
        <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border px-4 py-2 text-sm font-medium"
        >
            Sign out
        </button>
    ) : (
        <button
            type="button"
            onClick={handleSignIn}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
            Sign in
        </button>
    );
}