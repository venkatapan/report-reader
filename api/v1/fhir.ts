import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    // 2. POST only
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // 3. Parse JSON body
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        error: "FHIR JSON body is required",
      });
    }

    // 4. Validate FHIR resource type
    const resourceType = body.resourceType;

    const supportedResources = [
      "Patient",
      "Observation",
      "DiagnosticReport",
    ];

    if (!supportedResources.includes(resourceType)) {
      return res.status(400).json({
        error: "Unsupported FHIR resource type",
        supported_resources: supportedResources,
      });
    }

    // 5. Normalize resource
    const normalizedData: Record<string, unknown> = {
      resource_type: resourceType,
      resource_id: body.id || null,
    };

    // Patient
    if (resourceType === "Patient") {
      normalizedData.patient = {
        id: body.id || null,
        identifier: body.identifier || [],
        name: body.name || [],
        gender: body.gender || null,
        date_of_birth: body.birthDate || null,
      };
    }

    // Observation
    if (resourceType === "Observation") {
      normalizedData.observation = {
        id: body.id || null,
        status: body.status || null,
        code: body.code || null,
        value: body.valueQuantity || null,
        reference_range: body.referenceRange || [],
        effective_date: body.effectiveDateTime || null,
      };
    }

    // DiagnosticReport
    if (resourceType === "DiagnosticReport") {
      normalizedData.diagnostic_report = {
        id: body.id || null,
        status: body.status || null,
        code: body.code || null,
        effective_date: body.effectiveDateTime || null,
        conclusion: body.conclusion || null,
        results: body.result || [],
      };
    }

    // 6. Return normalized FHIR response
    return res.status(200).json({
      success: true,
      api_version: "v1",
      source: "FHIR",
      data: normalizedData,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message || "Internal server error",
    });
  }
}
