export interface FHIRAuthOptions {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export interface FHIRAuthToken {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export async function getFHIRAccessToken(
  options: FHIRAuthOptions
): Promise<FHIRAuthToken> {
  const body = new URLSearchParams();

  body.set("grant_type", "client_credentials");
  body.set("client_id", options.clientId);
  body.set("client_secret", options.clientSecret);

  if (options.scope) {
    body.set("scope", options.scope);
  }

  const response = await fetch(
    options.tokenUrl,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `FHIR authentication failed (${response.status}): ${errorText}`
    );
  }

  const token =
    (await response.json()) as FHIRAuthToken;

  if (!token.access_token) {
    throw new Error(
      "FHIR authentication response did not contain an access token"
    );
  }

  return token;
}
