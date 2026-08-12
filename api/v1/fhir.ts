import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { HealthcareResponse } from "./healthcare";

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

    // 3. Read FHIR JSON
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        error: "FHIR JSON body is required",
      });
    }

    // 4. Validate resource type
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

    // 5. Create common healthcare response
    const response: HealthcareResponse = {
      success: true,
      api_version: "v1",
      source: "FHIR",

      data: {
        patient: {},
        encounter: {},
        clinical: {},
        observations: [],
        document: {
          type: "FHIR",
          title: null,
          date: null,
        },
        metadata: {
          fhir_resource_type: resourceType,
          fhir_resource_id: body.id || null,
        },
      },
    };

    // 6. Patient
    if (resourceType === "Patient") {
      const firstName =
        body.name?.[0]?.given?.join(" ") || "";

      const familyName =
        body.name?.[0]?.family || "";

      const fullName =
        [firstName, familyName]
          .filter(Boolean)
          .join(" ") || null;

      response.data.patient = {
        id: body.id || null,
        name: fullName,
        gender: body.gender || null,
        date_of_birth: body.birthDate || null,
      };

      response.data.document = {
        type: "FHIR Patient",
        title: "Patient Record",
        date: null,
      };

      response.data.metadata = {
        fhir_resource_type: "Patient",
        fhir_resource_id: body.id || null,
        identifiers: body.identifier || [],
      };
    }

    // 7. Observation
    if (resourceType === "Observation") {
      const coding = body.code?.coding?.[0];

      response.data.observations = [
        {
          code: coding?.code || null,

          name:
            coding?.display ||
            body.code?.text ||
            null,

          value:
            body.valueQuantity?.value ??
            null,

          unit:
            body.valueQuantity?.unit ||
            null,

          reference_range:
            body.referenceRange?.length
              ? JSON.stringify(body.referenceRange)
              : null,

          status:
            body.status ||
            null,
        },
      ];

      response.data.document = {
        type: "FHIR Observation",
        title:
          coding?.display ||
          body.code?.text ||
          "FHIR Observation",
        date:
          body.effectiveDateTime ||
          null,
      };

      response.data.metadata = {
        fhir_resource_type: "Observation",
        fhir_resource_id: body.id || null,
        effective_date:
          body.effectiveDateTime || null,
      };
    }

    // 8. DiagnosticReport
    if (resourceType === "DiagnosticReport") {
      const coding = body.code?.coding?.[0];

      response.data.document = {
        type: "FHIR DiagnosticReport",
        title:
          coding?.display ||
          body.code?.text ||
          "Diagnostic Report",
        date:
          body.effectiveDateTime ||
          null,
      };

      response.data.clinical = {
        diagnosis: body.conclusion
          ? [body.conclusion]
          : [],
        procedures: [],
        medications: [],
        allergies: [],
      };

      response.data.metadata = {
        fhir_resource_type: "DiagnosticReport",
        fhir_resource_id: body.id || null,
        status: body.status || null,
        results: body.result || [],
      };
    }

    // 9. Return common healthcare response
    return res.status(200).json(response);
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "Internal server error",
    });
  }
}
