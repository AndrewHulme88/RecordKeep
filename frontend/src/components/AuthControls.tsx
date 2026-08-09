"use client";

import { signInWithRedirect, signOut } from "aws-amplify/auth";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function AuthControls() {
    const { isSignedIn, isLoading } = useAuthStatus();

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
            className="button-secondary"
        >
            Sign out
        </button>
    ) : (
        <button
            type="button"
            onClick={handleSignIn}
            className="button-primary"
        >
            Sign in
        </button>
    );
}
