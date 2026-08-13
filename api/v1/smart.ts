import type { VercelRequest, VercelResponse } from "@vercel/node";
import { discoverSMARTConfiguration } from "../../lib/types/smart-config.js";

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

    const [scheme, token] = authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      token !== process.env.AIREPORTREADER_API_KEY
    ) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    // 2. GET only
    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. FHIR server URL
    const baseUrl =
      process.env.FHIR_SERVER_URL;

    if (!baseUrl) {
      return res.status(500).json({
        error: "FHIR server URL is not configured",
      });
    }

    // 4. Discover SMART configuration
    const configuration =
      await discoverSMARTConfiguration(baseUrl);

    // 5. Return discovery metadata
    return res.status(200).json({
      success: true,
      api_version: "v1",
      source: "SMART",
      data: {
        token_endpoint:
          configuration.token_endpoint || null,

        authorization_endpoint:
          configuration.authorization_endpoint || null,

        scopes_supported:
          configuration.scopes_supported || [],

        grant_types_supported:
          configuration.grant_types_supported || [],

        token_endpoint_auth_methods_supported:
          configuration.token_endpoint_auth_methods_supported ||
          [],
      },
    });
  } catch (error: any) {
    console.error(
      "SMART discovery error:",
      error
    );

    return res.status(502).json({
      error:
        error.message ||
        "SMART configuration discovery failed",
    });
  }
}
