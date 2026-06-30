import { fetchAuthSession } from "aws-amplify/auth";

export async function authenticatedFetch(
    input: string,
    init: RequestInit = {},
): Promise<Response> {
    // Retrieve the current Cognito session so protected API requests
    // can include the user's access token.
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
        throw new Error("You must be signed in.");
    }

    const headers = new Headers(init.headers);

    headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(input, {
        ...init,
        headers,
    });
}