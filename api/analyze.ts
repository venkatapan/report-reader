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
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key missing" });
    }

    const form = formidable({});

    const [fields, files] = await form.parse(req);

    const textInput =
      typeof fields.text?.[0] === "string"
        ? fields.text[0]
        : "";

    let parts: any[] = [];

    // TEXT INPUT
    if (textInput.trim()) {
      parts.push({
        text: `
You are a medical lab report explainer.

Give:
1. Quick summary
2. Abnormal findings
3. Normal findings
4. What this means in simple English

Keep response short, clean, readable.

Color hint labels:
🟢 Normal
🟡 Borderline
🔴 High/Low

Medical Report:
${textInput}
        `,
      });
    }

    // FILE INPUT
    const uploadedFile = files.file?.[0];

    if (uploadedFile) {
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);

      const base64File = fileBuffer.toString("base64");

      parts.push({
        inlineData: {
          mimeType: uploadedFile.mimetype || "application/pdf",
          data: base64File,
        },
      });

      parts.push({
        text: `
Analyze this medical report.

Give:
1. Quick summary
2. Abnormal findings
3. Normal findings
4. What this means in simple English

Keep response clean and mobile friendly.

Use:
🟢 Normal
🟡 Borderline
🔴 High/Low
        `,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    return res.status(200).json({
      result: response.text,
    });

  } catch (error: any) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
}
