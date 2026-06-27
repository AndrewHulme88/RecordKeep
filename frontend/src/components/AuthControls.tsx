"use client";

import { useEffect,useState } from "react";
import { getCurrentUser, signInWithRedirect, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export default function AuthControls() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    async function checkAuthState() {
        try {
            await getCurrentUser();
            setIsSignedIn(true);
        } catch {
            setIsSignedIn(false);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        checkAuthState();

        const unsubscribe = Hub.listen("auth", ({ payload }) => {
            if (payload.event === "signedIn") {
                setIsSignedIn(true);
            }

            if (payload.event === "signedOut") {
                setIsSignedIn(false);
            }
        });

        return unsubscribe;
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