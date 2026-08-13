export interface FHIRAuthOptions {
  tokenUrl: string;
  clientId: string;
  privateKey: string;
  scope: string;
  keyId?: string;
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
  throw new Error(
    "SMART Backend Services JWT authentication is not configured yet"
  );
}
