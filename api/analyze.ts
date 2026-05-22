import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const boundary = req.headers["content-type"]?.split("boundary=")[1];

    if (!boundary) {
      return res.status(400).json({ error: "Invalid form data" });
    }

    // Convert uploaded file to base64
    const base64 = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",

      contents: [
        {
          role: "user",

          parts: [

            {
              text: `
Analyze this medical report in simple English.

Use headings:
## 🟢 Normal
## 🟡 Borderline
## 🔴 Needs Attention

Rules:
- Keep the explanation short and mobile friendly
- Avoid long paragraphs
- Avoid markdown tables
- Mention only important findings
- Use bullet points when possible

Always include:
## Overall Summary

At the end include:
"This explanation is AI-generated and not a medical diagnosis. Please consult a doctor for professional advice."
`,
            },

            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },

          ],
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
