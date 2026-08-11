import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,  
  },
};

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

    // 2. Gemini API key
    const geminiKey = process.env.API_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        error: "Gemini API key missing",
      });
    }

    // 3. Parse request
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    const textInput = Array.isArray(fields.text)
      ? fields.text[0]
      : fields.text;

    if (!uploadedFile && !textInput) {
      return res.status(400).json({
        error: "Provide either a medical report file or text",
      });
    }

    // 4. Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const analysisPrompt = `
Analyze this medical report carefully.

Return ONLY valid JSON using exactly this structure:

{
  "summary": "Short overall summary",
  "normal_findings": [
    "Important normal finding"
  ],
  "borderline_findings": [
    "Important borderline finding"
  ],
  "abnormal_findings": [
    "Important abnormal finding"
  ],
  "what_it_means": "Simple explanation of what the findings generally mean"
}

Rules:
- Use simple English.
- Keep the response concise.
- Include only clinically relevant findings.
- Do not invent values or findings.
- If a category has no findings, return an empty array.
- Do not provide a diagnosis.
- Do not provide treatment instructions.
- Do not use Markdown.
- Return JSON only.
`;

    let response;

    // 5. File analysis
    if (uploadedFile) {
      const fileBuffer = fs.readFileSync(
        uploadedFile.filepath
      );

      const base64File = fileBuffer.toString("base64");

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: analysisPrompt,
              },
              {
                inlineData: {
                  mimeType:
                    uploadedFile.mimetype ||
                    "application/pdf",
                  data: base64File,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    // 6. Text analysis
    else {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
${analysisPrompt}

Medical Report:
${textInput}
`,
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    // 7. Convert Gemini JSON text into real JSON
    const rawResult = response.text;

    if (!rawResult) {
      return res.status(500).json({
        error: "No analysis returned by AI",
      });
    }

    let parsedResult;

    try {
      parsedResult = JSON.parse(rawResult);
    } catch {
      return res.status(500).json({
        error: "AI returned an invalid JSON response",
      });
    }

    // 8. Structured API response
    return res.status(200).json({
      success: true,
      data: parsedResult,
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
