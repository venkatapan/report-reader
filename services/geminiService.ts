import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../types";

const apiKey = process.env.API_KEY;

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix
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

export const analyzeReport = async (text: string, file: File | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Lower temperature for more factual and stable explanations
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from the model.");
    }

    return resultText;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    // Rethrow to be caught by the App level handler which displays a calm message
    throw error;
  }
};