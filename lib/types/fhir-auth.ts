import { importPKCS8, SignJWT } from "jose";

export interface FHIRAuthOptions { 
  tokenUrl: string;
  clientId: string;
  privateJwk: string;
  scope: string;
  keyId: string;
}

export interface FHIRAuthToken {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export async function getFHIRAccessToken(
  options: FHIRAuthOptions
): Promise<FHIRAuthToken> {
  const privateJwk = JSON.parse(options.privateJwk);

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-384",
    },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);

  const clientAssertion = await new SignJWT({})
    .setProtectedHeader({
      alg: "RS384",
      kid: options.keyId,
      typ: "JWT",
    })
    .setIssuer(options.clientId)
    .setSubject(options.clientId)
    .setAudience(options.tokenUrl)
    .setJti(crypto.randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);

  const body = new URLSearchParams();

body.set(
  "grant_type",
  "client_credentials"
);


body.set(
  "scope",
  options.scope
);
  
  body.set(
    "client_assertion_type",
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
  );

  body.set(
    "client_assertion",
    clientAssertion
  );

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
