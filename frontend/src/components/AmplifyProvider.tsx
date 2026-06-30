"use client";

import "@/lib/amplify-config";
import "aws-amplify/auth/enable-oauth-listener";

type AmplifyProviderProps = {
    children: React.ReactNode;
};

export default function AmplifyProvider({
    children,
}: AmplifyProviderProps) {
    // Importing the files above configures Amplify and enables OAuth
    // callback handling once on the client for the entire application.
    return children;
}