"use client";

import "@/lib/amplify-config";
import "aws-amplify/auth/enable-oauth-listener";

type AmplifyProviderProps = {
    children: React.ReactNode;
};

export default function AmplifyProvider({
    children,
}: AmplifyProviderProps) {
    return children;
}