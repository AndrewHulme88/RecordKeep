import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

if (!userPoolId || !userPoolClientId || !domain) {
  throw new Error("Cognito environment variables are not configured.");
}

const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

const redirectSignIn = `${origin}/auth/callback`;
const redirectSignOut = origin;

console.log("Amplify OAuth redirectSignIn:", redirectSignIn);
console.log("Amplify OAuth redirectSignOut:", redirectSignOut);

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        oauth: {
          domain,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [redirectSignIn],
          redirectSignOut: [redirectSignOut],
          responseType: "code",
        },
      },
    },
  },
});