"use client";

import "aws-amplify/auth/enable-oauth-listener";
import "@/lib/amplify-config";

export function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}