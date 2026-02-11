import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../types";

// ✅ Correct way to read env variable in Vite
const apiKey = import.meta.env.VITE_API_KEY;

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];

      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeReport = async (
  text: string,
  file: File | null
): Promise<string> => {

  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [];

    if (file) {
      const filePart = await fileToGenerativePart(file);
      parts.push(filePart);
    }

    if (text) {
      parts.push({ text: `User provided text: ${text}` });
    }

    if (parts.length === 0) {
      throw new Error("No input provided.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    const resultText = response.text;

    if (!resultText) {
      throw new Error("Empty response from the model.");
    }

    return resultText;

  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
