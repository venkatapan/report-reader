import { GoogleGenAI } from "@google/genai";
import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import type {
  HealthcareResponse,
} from "./healthcare";

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

    // 4. Read normalized healthcare data
    const healthcareData =
      req.body as HealthcareResponse;

    if (
      !healthcareData ||
      healthcareData.success !== true ||
      !healthcareData.source ||
      !healthcareData.data
    ) {
      return res.status(400).json({
        error:
          "Valid HealthcareResponse is required",
      });
    }

    // 5. Send structured healthcare data to Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const analysisPrompt = `
Analyze the following healthcare data in simple English.

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
- The input may come from FHIR or DICOM/PACS.
- Use only the supplied healthcare data.
- Return JSON only.

Healthcare data:

${JSON.stringify(
  healthcareData,
  null,
  2
)}
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisPrompt,
        config: {
          responseMimeType:
            "application/json",
        },
      });

    const rawResult = response.text;

    if (!rawResult) {
      return res.status(500).json({
        error:
          "No analysis returned by AI",
      });
    }

    let analysis;

    try {
      analysis = JSON.parse(
        rawResult
      );
    } catch {
      return res.status(500).json({
        error:
          "AI returned an invalid JSON response",
      });
    }

    // 6. Return healthcare data + AI analysis
    return res.status(200).json({
      success: true,
      api_version: "v1",
      source: healthcareData.source,

      data: healthcareData.data,

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
