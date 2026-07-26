"use client";

import "@/lib/amplify-config";
import "aws-amplify/auth/enable-oauth-listener";

export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}