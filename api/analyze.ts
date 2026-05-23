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
      return res.status(500).json({
        error: "API key missing",
      });
    }

    const form = formidable({});

    const [fields, files] = await form.parse(req);

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    const textInput = Array.isArray(fields.text)
      ? fields.text[0]
      : fields.text;

    const ai = new GoogleGenAI({
      apiKey,
    });

    let response;

    // FILE ANALYSIS
    if (uploadedFile) {
      const fileBuffer = fs.readFileSync(
        uploadedFile.filepath
      );

      const base64File =
        fileBuffer.toString("base64");

      response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",

          contents: [
            {
              role: "user",

              parts: [
                {
                  text: `
Analyze this medical report in simple English.

FORMAT:

## Overall Summary

## 🟢 Normal Findings

## 🟡 Borderline Findings

## 🔴 Abnormal Findings

## What This Means

Rules:
- Keep response concise
- Use bullet points
- Avoid markdown tables
- Avoid huge paragraphs
- Mention only important findings
- Make it mobile friendly

End with:
"This explanation is AI-generated and not a medical diagnosis."
`,
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
        });
    }

    // TEXT ANALYSIS
    else {
      response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",

          contents: `
Analyze this medical report in simple English.

Medical Report:
${textInput}

FORMAT:

## Overall Summary

## 🟢 Normal Findings

## 🟡 Borderline Findings

## 🔴 Abnormal Findings

## What This Means

Rules:
- Keep response concise
- Use bullet points
- Avoid markdown tables
- Avoid huge paragraphs
- Mention only important findings
- Make it mobile friendly

End with:
"This explanation is AI-generated and not a medical diagnosis."
`,
        });
    }

    return res.status(200).json({
      result: response.text,
    });

  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}
