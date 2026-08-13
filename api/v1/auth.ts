import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getFHIRAccessToken,
} from "../../lib/types/fhir-auth.js";

export default async function handler( 
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. API authentication
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header required",
      });
    }

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      token !==
        process.env.AIREPORTREADER_API_KEY
    ) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    // 2. POST only
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. Read OAuth configuration
    const tokenUrl =
  process.env.FHIR_TOKEN_URL;

const clientId =
  process.env.FHIR_CLIENT_ID;

const privateJwk =
  process.env.FHIR_PRIVATE_JWK;

const scope =
  process.env.FHIR_SCOPE;

const keyId =
  process.env.FHIR_KEY_ID;

if (
  !tokenUrl ||
  !clientId ||
  !privateJwk ||
  !scope ||
  !keyId
) {
  return res.status(500).json({
    error:
      "FHIR OAuth configuration is incomplete",
  });
}

    // 4. Request access token
const tokenResponse =
  await getFHIRAccessToken({
    tokenUrl,
    clientId,
    privateJwk,
    scope,
    keyId,
  });
    // 5. Never expose the access token
    return res.status(200).json({
      success: true,
      authenticated: true,
      token_type:
        tokenResponse.token_type ||
        "Bearer",
      expires_in:
        tokenResponse.expires_in ||
        null,
    });
  } catch (error: any) {
    console.error(
      "FHIR authentication error:",
      error
    );

    return res.status(502).json({
      error:
        error.message ||
        "FHIR authentication failed",
    });
  }
}
