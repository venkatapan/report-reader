import { GoogleGenAI } from "@google/genai";
import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import type {
  HealthcareResponse,
} from "../../lib/healthcare";

interface HospitalWorkflowInput {
  fhir?: HealthcareResponse;
  pacs?: HealthcareResponse;
  healthcareData?: HealthcareResponse;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. API authentication
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error:
          "Authorization header required",
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

    // 3. Gemini API key
    const geminiKey =
      process.env.API_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        error:
          "Gemini API key missing",
      });
    }

    // 4. Read request body
    const body =
      req.body as HospitalWorkflowInput;

    const fhir =
      body?.fhir;

    const pacs =
      body?.pacs;

    const singleHealthcareData =
      body?.healthcareData;

    // 5. Collect valid healthcare sources
    const healthcareResponses:
      HealthcareResponse[] = [];

    if (
      singleHealthcareData &&
      singleHealthcareData.success === true &&
      singleHealthcareData.data
    ) {
      healthcareResponses.push(
        singleHealthcareData
      );
    }

    if (
      fhir &&
      fhir.success === true &&
      fhir.data
    ) {
      healthcareResponses.push(fhir);
    }

    if (
      pacs &&
      pacs.success === true &&
      pacs.data
    ) {
      healthcareResponses.push(pacs);
    }

    if (
      healthcareResponses.length === 0
    ) {
      return res.status(400).json({
        error:
          "Provide a valid HealthcareResponse, FHIR HealthcareResponse, or PACS HealthcareResponse",
      });
    }

    // 6. Merge patient data
    const combinedPatient = {
      ...(pacs?.data.patient || {}),
      ...(fhir?.data.patient || {}),
      ...(singleHealthcareData?.data.patient || {}),
    };

    // 7. Merge encounter data
    const combinedEncounter = {
      ...(pacs?.data.encounter || {}),
      ...(fhir?.data.encounter || {}),
      ...(singleHealthcareData?.data.encounter || {}),
    };

    // 8. Merge clinical data
    const combinedClinical = {
      diagnosis: [
        ...(fhir?.data.clinical.diagnosis || []),
        ...(pacs?.data.clinical.diagnosis || []),
        ...(singleHealthcareData?.data.clinical.diagnosis || []),
      ],

      procedures: [
        ...(fhir?.data.clinical.procedures || []),
        ...(pacs?.data.clinical.procedures || []),
        ...(singleHealthcareData?.data.clinical.procedures || []),
      ],

      medications: [
        ...(fhir?.data.clinical.medications || []),
        ...(pacs?.data.clinical.medications || []),
        ...(singleHealthcareData?.data.clinical.medications || []),
      ],

      allergies: [
        ...(fhir?.data.clinical.allergies || []),
        ...(pacs?.data.clinical.allergies || []),
        ...(singleHealthcareData?.data.clinical.allergies || []),
      ],
    };

    // 9. Merge observations
    const combinedObservations = [
      ...(fhir?.data.observations || []),
      ...(pacs?.data.observations || []),
      ...(singleHealthcareData?.data.observations || []),
    ];

    // 10. Merge metadata
    const combinedMetadata = {
      ...(pacs?.data.metadata || {}),
      ...(fhir?.data.metadata || {}),
      ...(singleHealthcareData?.data.metadata || {}),

      sources:
        healthcareResponses.map(
          (item) => item.source
        ),
    };

    // 11. Select document
    const combinedDocument =
      fhir?.data.document ||
      pacs?.data.document ||
      singleHealthcareData?.data.document ||
      {
        type: null,
        title: null,
        date: null,
      };

    // 12. Build unified healthcare data
    const healthcareData = {
      success: true,
      api_version: "v1" as const,

      source:
        healthcareResponses.length === 1
          ? healthcareResponses[0].source
          : "FHIR" as const,

      data: {
        patient:
          combinedPatient,

        encounter:
          combinedEncounter,

        clinical:
          combinedClinical,

        observations:
          combinedObservations,

        document:
          combinedDocument,

        metadata:
          combinedMetadata,
      },
    };

    // 13. Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const analysisPrompt = `
Analyze the following hospital healthcare data
in simple English.

The data may contain information from:
- FHIR / EHR
- PACS / DICOM

Use ALL supplied information together.

Return ONLY valid JSON using exactly this structure:

{
  "summary": "Short overall summary",
  "normal_findings": [],
  "borderline_findings": [],
  "abnormal_findings": [],
  "what_it_means": "Simple explanation of what the findings generally mean"
}

Rules:
- Use simple English.
- Keep the response concise.
- Mention only clinically relevant findings.
- Do not invent values or findings.
- If a category has no findings, return an empty array.
- Do not provide a diagnosis.
- Do not provide treatment instructions.
- Do not assume information that is not present.
- Treat FHIR/EHR data and DICOM/PACS data as complementary sources.
- Return JSON only.

Hospital healthcare data:

${JSON.stringify(
  healthcareData,
  null,
  2
)}
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents:
          analysisPrompt,

        config: {
          responseMimeType:
            "application/json",
        },
      });

    // 14. Parse Gemini response
    const rawResult =
      response.text;

    if (!rawResult) {
      return res.status(500).json({
        error:
          "No analysis returned by AI",
      });
    }

    let analysis: any;

    try {
      analysis =
        JSON.parse(rawResult);
    } catch {
      return res.status(500).json({
        error:
          "AI returned an invalid JSON response",
      });
    }

    // 15. Return result
    return res.status(200).json({
      success: true,
      api_version: "v1",

      source:
        healthcareData.source,

      sources:
        healthcareData.data.metadata.sources,

      data:
        healthcareData.data,

      analysis: {
        summary:
          analysis.summary || "",

        normal_findings:
          Array.isArray(
            analysis.normal_findings
          )
            ? analysis.normal_findings
            : [],

        borderline_findings:
          Array.isArray(
            analysis.borderline_findings
          )
            ? analysis.borderline_findings
            : [],

        abnormal_findings:
          Array.isArray(
            analysis.abnormal_findings
          )
            ? analysis.abnormal_findings
            : [],

        what_it_means:
          analysis.what_it_means || "",
      },

      disclaimer:
        "This explanation is AI-generated and not a medical diagnosis.",
    });
  } catch (error: any) {
    console.error(
      "Healthcare AI analysis error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Healthcare AI analysis failed",
    });
  }
}
