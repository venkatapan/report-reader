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

    // IMAGE / PDF upload
    if (uploadedFile) {
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);

      const base64File = fileBuffer.toString("base64");

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
You are a medical report summarizer.

Analyze the uploaded lab report and provide:

# Overall Summary
Short simple explanation in plain English.

# Abnormal Findings
Mention only abnormal values with:
- test name
- value
- whether High or Low
- short meaning

# Normal Findings
Mention important normal values briefly.

# What This Means
Simple practical interpretation.

Keep response concise, clean, and mobile-friendly.

Do NOT give excessive warnings.
Do NOT ask follow-up questions.
`,
              },

              {
                inlineData: {
                  mimeType: uploadedFile.mimetype || "application/pdf",
                  data: base64File,
                },
              },
            ],
          },
        ],
      });
    }

    // TEXT INPUT
    else {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: `
You are a medical report summarizer.

Analyze this report:

${textInput}

Provide:
- Overall Summary
- Abnormal Findings
- Normal Findings
- What This Means

Keep it concise and mobile-friendly.
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
