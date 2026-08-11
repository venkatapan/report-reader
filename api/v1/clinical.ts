import { GoogleGenAI } from "@google/genai";
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

    // 3. Read HL7 message
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }

    const hl7Message = Buffer.concat(chunks).toString("utf8");

    if (!hl7Message.trim()) {
      return res.status(400).json({
        error: "HL7 message is required",
      });
    }

    // 4. Parse HL7
    const segments = hl7Message
      .replace(/\r\n/g, "\r")
      .replace(/\n/g, "\r")
      .split("\r")
      .filter(Boolean);

    const parsedSegments = segments.map((segment) => {
      const fields = segment.split("|");

      return {
        type: fields[0],
        fields,
      };
    });

    const msh = parsedSegments.find(
      (segment) => segment.type === "MSH"
    );

    const obxSegments = parsedSegments.filter(
      (segment) => segment.type === "OBX"
    );

    if (!msh) {
      return res.status(400).json({
        error: "Invalid HL7 message: MSH segment missing",
      });
    }

    if (obxSegments.length === 0) {
      return res.status(400).json({
        error: "No clinical observations found in HL7 message",
      });
    }

    // 5. Extract clinical observations
    const observations = obxSegments.map((obx) => ({
      observation_id: obx.fields[3] || null,
      value: obx.fields[5] || null,
      units: obx.fields[6] || null,
      reference_range: obx.fields[7] || null,
      status: obx.fields[11] || null,
    }));

    // 6. Gemini API key
    const geminiKey = process.env.API_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        error: "Gemini API key missing",
      });
    }

    // 7. Send clinical data to Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const prompt = `
Analyze these clinical laboratory observations.

Return ONLY valid JSON using exactly this structure:

{
  "summary": "Short overall summary",
  "normal_findings": [],
  "borderline_findings": [],
  "abnormal_findings": [],
  "what_it_means": "Simple explanation"
}

Rules:
- Analyze only the supplied observations.
- Do not invent missing information.
- Use simple English.
- Keep the response concise.
- Do not provide a diagnosis.
- Do not provide treatment instructions.
- Return JSON only.

Clinical observations:

${JSON.stringify(observations, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawResult = response.text;

    if (!rawResult) {
      return res.status(500).json({
        error: "No analysis returned by AI",
      });
    }

    let analysis;

    try {
      analysis = JSON.parse(rawResult);
    } catch {
      return res.status(500).json({
        error: "AI returned an invalid JSON response",
      });
    }

    // 8. Return enterprise-friendly response
  return res.status(200).json({
  success: true,

  api_version: "v1",

  source: "HL7",

  data: {
    observations,
    analysis: {
      summary: analysis.summary || "",
      normal_findings: Array.isArray(
        analysis.normal_findings
      )
        ? analysis.normal_findings
        : [],
      borderline_findings: Array.isArray(
        analysis.borderline_findings
      )
        ? analysis.borderline_findings
        : [],
      abnormal_findings: Array.isArray(
        analysis.abnormal_findings
      )
        ? analysis.abnormal_findings
        : [],
      what_it_means:
        analysis.what_it_means || "",
    },
  },

  disclaimer:
    "This explanation is AI-generated and not a medical diagnosis.",
});
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
