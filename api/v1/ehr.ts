import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FHIRClient } from "../../lib/types/fhir-client.js";
 
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

    // 4. Optional access token
    const accessToken =
      process.env.FHIR_ACCESS_TOKEN;

    const client = new FHIRClient({
      baseUrl,
      accessToken,
    });

    // 5. Requested resource
    const resourceType =
      typeof req.query.resourceType === "string"
        ? req.query.resourceType
        : "";

    const resourceId =
      typeof req.query.id === "string"
        ? req.query.id
        : "";

    const supportedResources = [
      "Patient",
      "Observation",
      "DiagnosticReport",
    ];

    if (
      !supportedResources.includes(
        resourceType
      )
    ) {
      return res.status(400).json({
        error: "Unsupported or missing resourceType",
        supported_resources:
          supportedResources,
      });
    }

    if (!resourceId) {
      return res.status(400).json({
        error: "FHIR resource id is required",
      });
    }

    // 6. Fetch resource from FHIR server
    const resource =
      await client.getResource(
        resourceType,
        resourceId
      );

    // 7. Return EHR resource
    return res.status(200).json({
      success: true,
      api_version: "v1",
      source: "EHR",
      data: {
        resource_type: resourceType,
        resource_id: resourceId,
        resource,
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "EHR integration request failed",
    });
  }
}
