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
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key missing" });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Form parse error" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [];

      if (files.file) {
        const uploadedFile = files.file as any;

        const fileData = fs.readFileSync(uploadedFile.filepath);
        const base64 = fileData.toString("base64");

        parts.push({
          inlineData: {
            data: base64,
            mimeType: uploadedFile.mimetype || "application/pdf",
          },
        });
      }

      if (fields.text) {
        parts.push({
          text: `User provided text: ${fields.text}`,
        });
      }

      if (parts.length === 0) {
        return res.status(400).json({ error: "No file or text provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      console.error("Gemini Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
