import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

if (!userPoolId || !userPoolClientId || !domain) {
    throw new Error("Cognito environment variables are not configured.");
}

// Configure Amplify to use the existing Cognito user pool and
// authorization code flow for browser based sign-in
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId,
            userPoolClientId,
            loginWith: {
                oauth: {
                    domain,
                    scopes: ["openid", "email", "profile"],
                    redirectSignIn: [
                        "http://localhost:3000/auth/callback",
                    ],
                    redirectSignOut: [
                        "http://localhost:3000",
                    ],
                    responseType: "code",
                },
            },
        },
    },
});